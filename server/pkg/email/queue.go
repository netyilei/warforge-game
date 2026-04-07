package email

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"strings"
	"sync"
	"time"

	"warforge-server/config"
	"warforge-server/database"
	systemdomain "warforge-server/internal/domain/system"
	systempersistence "warforge-server/internal/infrastructure/persistence/system"

	"github.com/redis/go-redis/v9"
)

const (
	EmailQueueKey           = "email:queue"
	EmailQueueProcessingKey = "email:queue:processing"
	EmailQueueRetryKey      = "email:queue:retry"
	MaxRetryCount           = 3
	RetryDelay              = 5 * time.Minute
)

type EmailTask struct {
	ID           string                 `json:"id"`
	To           string                 `json:"to"`
	Subject      string                 `json:"subject"`
	Content      string                 `json:"content"`
	TemplateCode string                 `json:"templateCode,omitempty"`
	ConfigCode   string                 `json:"configCode,omitempty"`
	Variables    map[string]interface{} `json:"variables,omitempty"`
	Source       string                 `json:"source"`
	RetryCount   int                    `json:"retryCount"`
	CreatedAt    time.Time              `json:"createdAt"`
}

type EmailQueueService struct {
	redisClient *redis.Client
}

var (
	queueService     *EmailQueueService
	queueServiceOnce sync.Once
)

func GetQueueService(redisClient *redis.Client) *EmailQueueService {
	queueServiceOnce.Do(func() {
		queueService = &EmailQueueService{
			redisClient: redisClient,
		}
	})
	return queueService
}

func (s *EmailQueueService) Enqueue(ctx context.Context, task *EmailTask) error {
	if task.ID == "" {
		task.ID = generateTaskID()
	}
	if task.CreatedAt.IsZero() {
		task.CreatedAt = time.Now()
	}

	data, err := json.Marshal(task)
	if err != nil {
		return fmt.Errorf("序列化邮件任务失败: %w", err)
	}

	if err := s.redisClient.RPush(ctx, EmailQueueKey, data).Err(); err != nil {
		return fmt.Errorf("入队邮件任务失败: %w", err)
	}

	log.Printf("[INFO] 邮件任务已入队: %s, 收件人: %s", task.ID, task.To)
	return nil
}

func (s *EmailQueueService) Dequeue(ctx context.Context) (*EmailTask, error) {
	result, err := s.redisClient.LPop(ctx, EmailQueueKey).Result()
	if err == redis.Nil {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("出队邮件任务失败: %w", err)
	}

	var task EmailTask
	if err := json.Unmarshal([]byte(result), &task); err != nil {
		return nil, fmt.Errorf("反序列化邮件任务失败: %w", err)
	}

	return &task, nil
}

func (s *EmailQueueService) EnqueueRetry(ctx context.Context, task *EmailTask) error {
	task.RetryCount++
	if task.RetryCount > MaxRetryCount {
		log.Printf("[ERROR] 邮件任务重试次数超限: %s, 收件人: %s", task.ID, task.To)
		return fmt.Errorf("重试次数超限")
	}

	data, err := json.Marshal(task)
	if err != nil {
		return fmt.Errorf("序列化邮件任务失败: %w", err)
	}

	score := float64(time.Now().Add(RetryDelay).Unix())
	if err := s.redisClient.ZAdd(ctx, EmailQueueRetryKey, redis.Z{Score: score, Member: data}).Err(); err != nil {
		return fmt.Errorf("入队重试任务失败: %w", err)
	}

	log.Printf("[INFO] 邮件任务已加入重试队列: %s, 重试次数: %d", task.ID, task.RetryCount)
	return nil
}

func (s *EmailQueueService) GetRetryTasks(ctx context.Context) ([]*EmailTask, error) {
	now := float64(time.Now().Unix())
	
	luaScript := `
		local results = redis.call('ZRANGEBYSCORE', KEYS[1], '-inf', ARGV[1])
		if #results > 0 then
			redis.call('ZREM', KEYS[1], unpack(results))
		end
		return results
	`
	
	results, err := s.redisClient.Eval(ctx, luaScript, []string{EmailQueueRetryKey}, now).Result()
	if err == redis.Nil {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("获取重试任务失败: %w", err)
	}

	strResults, ok := results.([]interface{})
	if !ok {
		return nil, nil
	}

	var tasks []*EmailTask
	for _, result := range strResults {
		str, ok := result.(string)
		if !ok {
			continue
		}
		var task EmailTask
		if err := json.Unmarshal([]byte(str), &task); err != nil {
			continue
		}
		tasks = append(tasks, &task)
	}

	return tasks, nil
}

func (s *EmailQueueService) GetQueueLength(ctx context.Context) (int64, error) {
	return s.redisClient.LLen(ctx, EmailQueueKey).Result()
}

func (s *EmailQueueService) GetRetryQueueLength(ctx context.Context) (int64, error) {
	return s.redisClient.ZCard(ctx, EmailQueueRetryKey).Result()
}

type EmailWorker struct {
	queueService *EmailQueueService
	db           *sql.DB
	stopCh       chan struct{}
	wg           sync.WaitGroup
}

func NewEmailWorker(queueService *EmailQueueService, db *sql.DB) *EmailWorker {
	return &EmailWorker{
		queueService: queueService,
		db:           db,
		stopCh:       make(chan struct{}),
	}
}

func (w *EmailWorker) Start(workerCount int) {
	for i := 0; i < workerCount; i++ {
		w.wg.Add(1)
		go w.run(i)
	}
	log.Printf("[INFO] 邮件 Worker 已启动, 数量: %d", workerCount)
}

func (w *EmailWorker) Stop() {
	close(w.stopCh)
	w.wg.Wait()
	log.Printf("[INFO] 邮件 Worker 已停止")
}

func (w *EmailWorker) run(workerID int) {
	defer w.wg.Done()

	ticker := time.NewTicker(1 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-w.stopCh:
			return
		case <-ticker.C:
			w.processTask()
			w.processRetryTasks()
		}
	}
}

func (w *EmailWorker) processTask() {
	ctx := context.Background()
	task, err := w.queueService.Dequeue(ctx)
	if err != nil {
		log.Printf("[ERROR] Worker 获取任务失败: %v", err)
		return
	}
	if task == nil {
		return
	}

	w.sendEmail(ctx, task)
}

func (w *EmailWorker) processRetryTasks() {
	ctx := context.Background()
	tasks, err := w.queueService.GetRetryTasks(ctx)
	if err != nil {
		log.Printf("[ERROR] Worker 获取重试任务失败: %v", err)
		return
	}

	for _, task := range tasks {
		w.sendEmail(ctx, task)
	}
}

func (w *EmailWorker) sendEmail(ctx context.Context, task *EmailTask) {
	configRepo := systempersistence.NewEmailConfigRepository(w.db)
	templateRepo := systempersistence.NewEmailTemplateRepository(w.db)

	var config *systemdomain.EmailConfig
	var err error

	if task.ConfigCode != "" {
		config, err = configRepo.FindByCode(ctx, task.ConfigCode)
	} else {
		config, err = configRepo.FindDefault(ctx)
	}

	if err != nil {
		log.Printf("[ERROR] 获取邮件配置失败: %v", err)
		w.recordLog(ctx, task, false, "邮件配置不存在")
		w.queueService.EnqueueRetry(ctx, task)
		return
	}

	var subject, content string
	subject = task.Subject
	content = task.Content

	if task.TemplateCode != "" {
		template, err := templateRepo.FindByCode(ctx, task.TemplateCode)
		if err != nil {
			log.Printf("[ERROR] 获取邮件模板失败: %v", err)
			w.recordLog(ctx, task, false, "邮件模板不存在")
			w.queueService.EnqueueRetry(ctx, task)
			return
		}

		if subject == "" {
			subject = template.Subject()
		}
		if content == "" {
			content = template.Content()
		}

		if task.Variables != nil {
			for key, value := range task.Variables {
				placeholder := fmt.Sprintf("{{%s}}", key)
				content = strings.ReplaceAll(content, placeholder, fmt.Sprintf("%v", value))
				subject = strings.ReplaceAll(subject, placeholder, fmt.Sprintf("%v", value))
			}
		}
	}

	if err := Send(config.ToDTO(), task.To, subject, content); err != nil {
		log.Printf("[ERROR] 发送邮件失败: %v, 任务ID: %s", err, task.ID)
		w.recordLog(ctx, task, false, err.Error())
		w.queueService.EnqueueRetry(ctx, task)
		return
	}

	log.Printf("[INFO] 邮件发送成功: %s, 收件人: %s", task.ID, task.To)
	w.recordLog(ctx, task, true, "")
}

func (w *EmailWorker) recordLog(ctx context.Context, task *EmailTask, success bool, errorMsg string) {
	status := "success"
	if !success {
		status = "failed"
	}

	query := fmt.Sprintf(`
		INSERT INTO %s (id, task_id, to_email, subject, source, status, error_message, retry_count, created_at)
		VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8)
	`, config.GetTableName("email_logs"))

	_, err := w.db.ExecContext(ctx, query,
		task.ID,
		task.To,
		task.Subject,
		task.Source,
		status,
		errorMsg,
		task.RetryCount,
		time.Now(),
	)

	if err != nil {
		log.Printf("[ERROR] 记录邮件日志失败: %v", err)
	}
}

func generateTaskID() string {
	return fmt.Sprintf("email_%d", time.Now().UnixNano())
}

func InitEmailWorker(redisClient *redis.Client, workerCount int) *EmailWorker {
	db := database.MustGetDB()
	queueSvc := GetQueueService(redisClient)
	worker := NewEmailWorker(queueSvc, db)
	worker.Start(workerCount)
	return worker
}

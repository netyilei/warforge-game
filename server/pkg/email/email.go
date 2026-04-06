package email

import (
	"crypto/tls"
	"encoding/base64"
	"fmt"
	"net/mail"
	"net/smtp"
	"strings"

	systemdomain "warforge-server/internal/domain/system"
)

type EmailSender struct {
	Config *systemdomain.EmailConfigDTO
}

func NewEmailSender(config *systemdomain.EmailConfigDTO) *EmailSender {
	return &EmailSender{Config: config}
}

func (e *EmailSender) Send(to, subject, content string) error {
	from := mail.Address{
		Name:    e.Config.FromName,
		Address: e.Config.FromEmail,
	}
	toAddr := mail.Address{Address: to}

	headers := make(map[string]string)
	headers["From"] = from.String()
	headers["To"] = toAddr.String()
	headers["Subject"] = subject
	headers["MIME-Version"] = "1.0"
	headers["Content-Type"] = "text/html; charset=UTF-8"
	headers["Content-Transfer-Encoding"] = "base64"

	var msg strings.Builder
	for k, v := range headers {
		msg.WriteString(fmt.Sprintf("%s: %s\r\n", k, v))
	}
	msg.WriteString("\r\n")

	encodedContent := base64.StdEncoding.EncodeToString([]byte(content))
	msg.WriteString(encodedContent)

	auth := smtp.PlainAuth("", e.Config.Username, e.Config.Password, e.Config.Host)

	addr := fmt.Sprintf("%s:%d", e.Config.Host, e.Config.Port)

	switch systemdomain.EmailProtocol(e.Config.Protocol) {
	case systemdomain.EmailProtocolSMTPS:
		return e.sendWithTLS(addr, auth, from.Address, []string{to}, []byte(msg.String()))
	case systemdomain.EmailProtocolSTARTTLS:
		return e.sendWithSTARTTLS(addr, auth, from.Address, []string{to}, []byte(msg.String()))
	default:
		return smtp.SendMail(addr, auth, from.Address, []string{to}, []byte(msg.String()))
	}
}

func (e *EmailSender) sendWithTLS(addr string, auth smtp.Auth, from string, to []string, msg []byte) error {
	host := e.Config.Host

	tlsConfig := &tls.Config{
		InsecureSkipVerify: true,
		ServerName:         host,
	}

	conn, err := tls.Dial("tcp", addr, tlsConfig)
	if err != nil {
		return fmt.Errorf("TLS连接失败: %v", err)
	}
	defer conn.Close()

	client, err := smtp.NewClient(conn, host)
	if err != nil {
		return fmt.Errorf("创建SMTP客户端失败: %v", err)
	}
	defer client.Close()

	if err = client.Auth(auth); err != nil {
		return fmt.Errorf("SMTP认证失败: %v", err)
	}

	if err = client.Mail(from); err != nil {
		return fmt.Errorf("设置发件人失败: %v", err)
	}

	for _, addr := range to {
		if err = client.Rcpt(addr); err != nil {
			return fmt.Errorf("设置收件人失败: %v", err)
		}
	}

	w, err := client.Data()
	if err != nil {
		return fmt.Errorf("准备邮件数据失败: %v", err)
	}

	_, err = w.Write(msg)
	if err != nil {
		return fmt.Errorf("写入邮件内容失败: %v", err)
	}

	err = w.Close()
	if err != nil {
		return fmt.Errorf("关闭邮件数据写入失败: %v", err)
	}

	return client.Quit()
}

func (e *EmailSender) sendWithSTARTTLS(addr string, auth smtp.Auth, from string, to []string, msg []byte) error {
	host := e.Config.Host

	client, err := smtp.Dial(addr)
	if err != nil {
		return fmt.Errorf("连接SMTP服务器失败: %v", err)
	}
	defer client.Close()

	if err = client.StartTLS(&tls.Config{
		InsecureSkipVerify: true,
		ServerName:         host,
	}); err != nil {
		return fmt.Errorf("STARTTLS失败: %v", err)
	}

	if err = client.Auth(auth); err != nil {
		return fmt.Errorf("SMTP认证失败: %v", err)
	}

	if err = client.Mail(from); err != nil {
		return fmt.Errorf("设置发件人失败: %v", err)
	}

	for _, addr := range to {
		if err = client.Rcpt(addr); err != nil {
			return fmt.Errorf("设置收件人失败: %v", err)
		}
	}

	w, err := client.Data()
	if err != nil {
		return fmt.Errorf("准备邮件数据失败: %v", err)
	}

	_, err = w.Write(msg)
	if err != nil {
		return fmt.Errorf("写入邮件内容失败: %v", err)
	}

	err = w.Close()
	if err != nil {
		return fmt.Errorf("关闭邮件数据写入失败: %v", err)
	}

	return client.Quit()
}

func Send(config *systemdomain.EmailConfigDTO, to, subject, content string) error {
	sender := NewEmailSender(config)
	return sender.Send(to, subject, content)
}

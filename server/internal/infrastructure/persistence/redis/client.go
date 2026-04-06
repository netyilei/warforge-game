package redis

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

type Config struct {
	Addr         string
	Password     string
	DB           int
	PoolSize     int
	MinIdleConns int
	DialTimeout  time.Duration
	ReadTimeout  time.Duration
	WriteTimeout time.Duration
}

func DefaultConfig() Config {
	return Config{
		Addr:         "localhost:6379",
		Password:     "",
		DB:           0,
		PoolSize:     10,
		MinIdleConns: 5,
		DialTimeout:  5 * time.Second,
		ReadTimeout:  3 * time.Second,
		WriteTimeout: 3 * time.Second,
	}
}

type Client struct {
	*redis.Client
	config Config
}

func NewClient(config Config) (*Client, error) {
	client := redis.NewClient(&redis.Options{
		Addr:         config.Addr,
		Password:     config.Password,
		DB:           config.DB,
		PoolSize:     config.PoolSize,
		MinIdleConns: config.MinIdleConns,
		DialTimeout:  config.DialTimeout,
		ReadTimeout:  config.ReadTimeout,
		WriteTimeout: config.WriteTimeout,
	})

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := client.Ping(ctx).Err(); err != nil {
		return nil, fmt.Errorf("failed to connect to redis: %w", err)
	}

	return &Client{Client: client, config: config}, nil
}

func (c *Client) Close() error {
	return c.Client.Close()
}

func (c *Client) GetJSON(ctx context.Context, key string, dest interface{}) error {
	val, err := c.Get(ctx, key).Result()
	if err != nil {
		return err
	}
	return json.Unmarshal([]byte(val), dest)
}

func (c *Client) SetJSON(ctx context.Context, key string, value interface{}, expiration time.Duration) error {
	data, err := json.Marshal(value)
	if err != nil {
		return err
	}
	return c.Set(ctx, key, data, expiration).Err()
}

func (c *Client) GetOrSet(ctx context.Context, key string, fn func() (interface{}, error), expiration time.Duration) (interface{}, error) {
	val, err := c.Get(ctx, key).Result()
	if err == nil {
		return val, nil
	}

	if err != redis.Nil {
		return nil, err
	}

	data, err := fn()
	if err != nil {
		return nil, err
	}

	if err := c.Set(ctx, key, data, expiration).Err(); err != nil {
		return nil, err
	}

	return data, nil
}

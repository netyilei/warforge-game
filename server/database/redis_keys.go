package database

const (
	RedisKeyAdminTokenPrefix   = "admin:token:"
	RedisKeyAdminRefreshPrefix = "admin:refresh:"
	RedisKeyAdminSessionPrefix = "admin:session:"
	RedisKeyAdminLockPrefix    = "admin:lock:"
	RedisKeyAdminCachePrefix   = "admin:cache:"
)

func GetAdminTokenKey(userID string) string {
	return RedisKeyAdminTokenPrefix + userID
}

func GetAdminRefreshKey(userID string) string {
	return RedisKeyAdminRefreshPrefix + userID
}

func GetAdminSessionKey(sessionID string) string {
	return RedisKeyAdminSessionPrefix + sessionID
}

func GetAdminLockKey(lockType string, key string) string {
	return RedisKeyAdminLockPrefix + lockType + ":" + key
}

func GetAdminCacheKey(cacheType string, key string) string {
	return RedisKeyAdminCachePrefix + cacheType + ":" + key
}

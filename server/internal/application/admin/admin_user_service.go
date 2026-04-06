package admin

import (
	"context"

	"golang.org/x/crypto/bcrypt"

	"warforge-server/internal/domain/admin"
	"warforge-server/internal/domain/shared"
	"warforge-server/pkg/utils"
)

type AdminUserService struct {
	userRepo admin.AdminUserRepository
}

func NewAdminUserService(userRepo admin.AdminUserRepository) *AdminUserService {
	return &AdminUserService{userRepo: userRepo}
}

func (s *AdminUserService) FindByID(ctx context.Context, id string) (*admin.AdminUser, error) {
	return s.userRepo.FindByID(ctx, id)
}

func (s *AdminUserService) FindByUsername(ctx context.Context, username string) (*admin.AdminUser, error) {
	return s.userRepo.FindByUsername(ctx, username)
}

func (s *AdminUserService) ExistsByUsername(ctx context.Context, username string) (bool, error) {
	return s.userRepo.ExistsByUsername(ctx, username)
}

func (s *AdminUserService) Create(ctx context.Context, username, password, nickname, email, phone, avatar string, status int, roleIDs []string) (*admin.AdminUser, error) {
	exists, err := s.userRepo.ExistsByUsername(ctx, username)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, admin.ErrUsernameExists
	}

	id := utils.GenerateUUID()
	passwordHash, _ := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)

	user := admin.NewAdminUser(id, username, string(passwordHash))
	user.SetNickname(nickname)
	user.SetEmail(email)
	user.SetPhone(phone)
	user.SetAvatar(avatar)
	user.SetStatus(admin.AdminUserStatus(status))

	if err := s.userRepo.Save(ctx, user); err != nil {
		return nil, err
	}

	if len(roleIDs) > 0 {
		if err := s.userRepo.SetRoles(ctx, id, roleIDs); err != nil {
			return nil, err
		}
	}

	return user, nil
}

func (s *AdminUserService) Update(ctx context.Context, id, nickname, email, phone, avatar string, status int) (*admin.AdminUser, error) {
	user, err := s.userRepo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}

	user.SetNickname(nickname)
	user.SetEmail(email)
	user.SetPhone(phone)
	user.SetAvatar(avatar)
	user.SetStatus(admin.AdminUserStatus(status))

	if err := s.userRepo.Save(ctx, user); err != nil {
		return nil, err
	}

	return user, nil
}

func (s *AdminUserService) Delete(ctx context.Context, id string) error {
	return s.userRepo.Delete(ctx, id)
}

func (s *AdminUserService) ListAll(ctx context.Context) ([]*admin.AdminUser, error) {
	return s.userRepo.ListAll(ctx)
}

func (s *AdminUserService) List(ctx context.Context, filter admin.AdminUserFilter) (*shared.QueryResult[*admin.AdminUser], error) {
	return s.userRepo.List(ctx, filter)
}

func (s *AdminUserService) UpdatePassword(ctx context.Context, id, passwordHash string) error {
	return s.userRepo.UpdatePassword(ctx, id, passwordHash)
}

func (s *AdminUserService) UpdateLastLogin(ctx context.Context, id string) error {
	return s.userRepo.UpdateLastLogin(ctx, id)
}

func (s *AdminUserService) GetRoleCodes(ctx context.Context, userID string) ([]string, error) {
	return s.userRepo.GetRoleCodes(ctx, userID)
}

func (s *AdminUserService) GetMenuCodes(ctx context.Context, userID string) ([]string, error) {
	return s.userRepo.GetMenuCodes(ctx, userID)
}

func (s *AdminUserService) GetButtonCodes(ctx context.Context, userID string) ([]string, error) {
	return s.userRepo.GetButtonCodes(ctx, userID)
}

func (s *AdminUserService) SetRoles(ctx context.Context, userID string, roleIDs []string) error {
	return s.userRepo.SetRoles(ctx, userID, roleIDs)
}

func (s *AdminUserService) GetRoles(ctx context.Context, userID string) ([]*admin.AdminRole, error) {
	return s.userRepo.GetRoles(ctx, userID)
}

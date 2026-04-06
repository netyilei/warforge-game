package admin

import (
	"context"

	"warforge-server/internal/domain/admin"
	"warforge-server/pkg/utils"
)

type AdminRoleService struct {
	roleRepo admin.AdminRoleRepository
}

func NewAdminRoleService(roleRepo admin.AdminRoleRepository) *AdminRoleService {
	return &AdminRoleService{roleRepo: roleRepo}
}

func (s *AdminRoleService) FindByID(ctx context.Context, id string) (*admin.AdminRole, error) {
	return s.roleRepo.FindByID(ctx, id)
}

func (s *AdminRoleService) FindByCode(ctx context.Context, code string) (*admin.AdminRole, error) {
	return s.roleRepo.FindByCode(ctx, code)
}

func (s *AdminRoleService) Create(ctx context.Context, name, code, description string, status, sortOrder int) (*admin.AdminRole, error) {
	existing, _ := s.roleRepo.FindByCode(ctx, code)
	if existing != nil {
		return nil, admin.ErrRoleCodeExists
	}

	id := utils.GenerateUUID()
	role := admin.NewAdminRole(id, name, code)
	role.SetDescription(description)
	role.SetStatus(admin.AdminRoleStatus(status))
	role.SetSortOrder(sortOrder)

	if err := s.roleRepo.Save(ctx, role); err != nil {
		return nil, err
	}
	return role, nil
}

func (s *AdminRoleService) Update(ctx context.Context, id, name, description string, status, sortOrder int) error {
	role, err := s.roleRepo.FindByID(ctx, id)
	if err != nil {
		return err
	}

	role.SetName(name)
	role.SetDescription(description)
	role.SetStatus(admin.AdminRoleStatus(status))
	role.SetSortOrder(sortOrder)

	return s.roleRepo.Save(ctx, role)
}

func (s *AdminRoleService) Delete(ctx context.Context, id string) error {
	return s.roleRepo.Delete(ctx, id)
}

func (s *AdminRoleService) ListAll(ctx context.Context) ([]*admin.AdminRole, error) {
	return s.roleRepo.ListAll(ctx)
}

func (s *AdminRoleService) ListActive(ctx context.Context) ([]*admin.AdminRole, error) {
	return s.roleRepo.ListActive(ctx)
}

func (s *AdminRoleService) GetPermissions(ctx context.Context, roleID string) ([]string, error) {
	return s.roleRepo.GetPermissions(ctx, roleID)
}

func (s *AdminRoleService) SetPermissions(ctx context.Context, roleID string, permissionIDs []string) error {
	return s.roleRepo.SetPermissions(ctx, roleID, permissionIDs)
}

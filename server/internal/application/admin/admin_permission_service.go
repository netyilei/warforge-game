package admin

import (
	"context"

	admindomain "warforge-server/internal/domain/admin"
	"warforge-server/pkg/utils"
)

type AdminPermissionService struct {
	permRepo admindomain.AdminPermissionRepository
}

func NewAdminPermissionService(permRepo admindomain.AdminPermissionRepository) *AdminPermissionService {
	return &AdminPermissionService{permRepo: permRepo}
}

func (s *AdminPermissionService) FindByID(ctx context.Context, id string) (*admindomain.AdminPermission, error) {
	return s.permRepo.FindByID(ctx, id)
}

func (s *AdminPermissionService) FindByCode(ctx context.Context, code string) (*admindomain.AdminPermission, error) {
	return s.permRepo.FindByCode(ctx, code)
}

func (s *AdminPermissionService) Create(ctx context.Context, name, code string, permType admindomain.PermissionType, parentID *string) (*admindomain.AdminPermission, error) {
	existing, _ := s.permRepo.FindByCode(ctx, code)
	if existing != nil {
		return nil, admindomain.ErrPermissionCodeExists
	}

	id := utils.GenerateUUID()
	perm := admindomain.NewAdminPermission(id, name, code, permType)
	if parentID != nil {
		perm.SetParentID(parentID)
	}

	if err := s.permRepo.Save(ctx, perm); err != nil {
		return nil, err
	}
	return perm, nil
}

func (s *AdminPermissionService) Update(ctx context.Context, id, name string, status admindomain.AdminPermissionStatus, sortOrder int) error {
	perm, err := s.permRepo.FindByID(ctx, id)
	if err != nil {
		return err
	}

	perm.SetName(name)
	perm.SetStatus(status)
	perm.SetSortOrder(sortOrder)

	return s.permRepo.Save(ctx, perm)
}

func (s *AdminPermissionService) Delete(ctx context.Context, id string) error {
	return s.permRepo.Delete(ctx, id)
}

func (s *AdminPermissionService) ListAll(ctx context.Context) ([]*admindomain.AdminPermission, error) {
	return s.permRepo.ListAll(ctx)
}

func (s *AdminPermissionService) ListActive(ctx context.Context) ([]*admindomain.AdminPermission, error) {
	return s.permRepo.ListActive(ctx)
}

func (s *AdminPermissionService) GetByParentID(ctx context.Context, parentID string) ([]*admindomain.AdminPermission, error) {
	return s.permRepo.GetByParentID(ctx, parentID)
}

func (s *AdminPermissionService) GetByUserID(ctx context.Context, userID string) ([]*admindomain.AdminPermission, error) {
	return s.permRepo.GetByUserID(ctx, userID)
}

func (s *AdminPermissionService) GetMenusByUserID(ctx context.Context, userID string) ([]*admindomain.MenuPermission, error) {
	return s.permRepo.GetMenusByUserID(ctx, userID)
}

func (s *AdminPermissionService) CheckRouteAccess(ctx context.Context, userID, routePath string) (bool, error) {
	return s.permRepo.CheckRouteAccess(ctx, userID, routePath)
}

func (s *AdminPermissionService) CheckPermission(ctx context.Context, userID, permissionCode string) (bool, error) {
	return s.permRepo.CheckPermission(ctx, userID, permissionCode)
}

func (s *AdminPermissionService) GetMenuPermissionsByMenuID(ctx context.Context, menuID string) ([]*admindomain.MenuPermissionDTO, error) {
	return s.permRepo.GetMenuPermissionsByMenuID(ctx, menuID)
}

func (s *AdminPermissionService) SetMenuPermissionsByMenuID(ctx context.Context, menuID string, permissions []*admindomain.MenuPermissionDTO) error {
	return s.permRepo.SetMenuPermissionsByMenuID(ctx, menuID, permissions)
}

func (s *AdminPermissionService) CreateFromEntity(ctx context.Context, perm *admindomain.AdminPermission) error {
	return s.permRepo.Save(ctx, perm)
}

func (s *AdminPermissionService) UpdateFromEntity(ctx context.Context, perm *admindomain.AdminPermission) error {
	return s.permRepo.Save(ctx, perm)
}

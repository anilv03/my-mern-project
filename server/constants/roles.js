const ROLES = {
  CUSTOMER: 'customer',
  SELLER: 'seller',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
};

const ROLE_HIERARCHY = {
  customer: 1,
  seller: 2,
  admin: 3,
  super_admin: 4,
};

const ROLES_ARRAY = Object.values(ROLES);

module.exports = { ROLES, ROLE_HIERARCHY, ROLES_ARRAY };

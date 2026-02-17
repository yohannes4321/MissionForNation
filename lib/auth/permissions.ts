import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements } from "better-auth/plugins/organization/access";

const statement = {
  ...defaultStatements,
  project: ["create", "share", "update", "delete"],
} as const;

const ac = createAccessControl(statement);

const member = ac.newRole({
  organization: [],
  member: [],
  invitation: [],
  team: [],
  ac: ["read"],
  project: ["create"],
});

const regional_admin = ac.newRole({
  organization: [],
  member: [],
  invitation: [],
  team: [],
  ac: ["read"],
  project: ["create", "update"],
});

const admin = ac.newRole({
  organization: ["update"],
  invitation: ["create", "cancel"],
  member: ["create", "update", "delete"],
  team: ["create", "update", "delete"],
  ac: ["create", "read", "update", "delete"],
  project: ["create", "update"],
});

const owner = ac.newRole({
  organization: ["update", "delete"],
  invitation: ["create", "cancel"],
  member: ["create", "update", "delete"],
  team: ["create", "update", "delete"],
  ac: ["create", "read", "update", "delete"],
  project: ["create", "update", "delete"],
});

const super_admin = ac.newRole({
  organization: ["update", "delete"],
  invitation: ["create", "cancel"],
  member: ["create", "update", "delete"],
  team: ["create", "update", "delete"],
  ac: ["create", "read", "update", "delete"],
  project: ["create", "share", "update", "delete"],
});

export { ac, admin, member, owner, regional_admin, super_admin, statement };

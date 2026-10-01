export type IntegracaoAccessLevel = "gestor" | "ugp";
export type IntegracaoManagerMode = "gestor" | "all" | "manual";

export type ManagerIntegracaoConfig = {
  enabled: boolean;
  programId: number | null;
  accessLevel: IntegracaoAccessLevel;
  mode: IntegracaoManagerMode;
  processIds: number[];
  legacyScopeAll: boolean;
  legacyUgpRestrita: boolean;
  demoOnly: boolean;
  ugpResponsible: boolean;
};

export const INTEGRACAO_ROUTE_PERMISSION = "/gestor/integracao";
const INTEGRACAO_SCOPE_PREFIX = "scope:integracao:";
const INTEGRACAO_PROGRAM_PREFIX = "scope:integracao:program:";
const INTEGRACAO_ACCESS_PREFIX = "scope:integracao:access:";
const INTEGRACAO_MODE_PREFIX = "scope:integracao:mode:";
const INTEGRACAO_PROCESS_PREFIX = "scope:integracao:process:";
const INTEGRACAO_DEMO_ONLY = "scope:integracao:demo-only";
export const INTEGRACAO_UGP_RESPONSIBLE = "scope:integracao:ugp-responsavel";

function positiveInt(value: unknown): number | null {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export function isIntegracaoPermissionToken(permission: string): boolean {
  return permission === INTEGRACAO_ROUTE_PERMISSION || permission.startsWith(INTEGRACAO_SCOPE_PREFIX);
}

export function hasIndependentIntegracaoConfig(permissions: string[]): boolean {
  return permissions.some((permission) => permission.startsWith(INTEGRACAO_PROGRAM_PREFIX));
}

export function parseManagerIntegracaoPermissions(permissions: string[]): ManagerIntegracaoConfig {
  const safePermissions = Array.isArray(permissions) ? permissions.filter(Boolean) : [];
  const enabled = safePermissions.includes(INTEGRACAO_ROUTE_PERMISSION);
  const legacyScopeAll = safePermissions.includes("scope:integracao:all");
  const demoOnly = safePermissions.includes(INTEGRACAO_DEMO_ONLY);
  const ugpResponsible = safePermissions.includes(INTEGRACAO_UGP_RESPONSIBLE);

  const programToken = safePermissions.find((permission) => permission.startsWith(INTEGRACAO_PROGRAM_PREFIX));
  const programId = programToken
    ? positiveInt(programToken.slice(INTEGRACAO_PROGRAM_PREFIX.length))
    : null;

  const modeToken = safePermissions.find((permission) => permission.startsWith(INTEGRACAO_MODE_PREFIX));
  const rawMode = modeToken?.slice(INTEGRACAO_MODE_PREFIX.length);
  const legacyUgpRestrita = rawMode === "ugp_restrita";
  const mode: IntegracaoManagerMode =
    rawMode === "manual" || rawMode === "all" || rawMode === "gestor"
      ? rawMode
      : legacyUgpRestrita
        ? "manual"
        : legacyScopeAll
          ? "all"
          : "gestor";

  const accessToken = safePermissions.find((permission) => permission.startsWith(INTEGRACAO_ACCESS_PREFIX));
  const rawAccess = accessToken?.slice(INTEGRACAO_ACCESS_PREFIX.length);
  const accessLevel: IntegracaoAccessLevel =
    rawAccess === "ugp" || rawAccess === "gestor"
      ? rawAccess
      : (legacyUgpRestrita || legacyScopeAll || mode === "all")
        ? "ugp"
        : "gestor";

  const processIds = Array.from(new Set(
    safePermissions
      .filter((permission) => permission.startsWith(INTEGRACAO_PROCESS_PREFIX))
      .map((permission) => positiveInt(permission.slice(INTEGRACAO_PROCESS_PREFIX.length)))
      .filter((id): id is number => id !== null),
  )).sort((a, b) => a - b);

  return {
    enabled,
    programId,
    accessLevel,
    mode,
    processIds,
    legacyScopeAll,
    legacyUgpRestrita,
    demoOnly,
    ugpResponsible,
  };
}

export function buildManagerIntegracaoPermissions(config: {
  enabled: boolean;
  programId: number | null;
  accessLevel: IntegracaoAccessLevel;
  mode: IntegracaoManagerMode;
  processIds?: number[];
  demoOnly?: boolean;
  ugpResponsible?: boolean;
}): string[] {
  if (!config.enabled) return [];

  const programId = positiveInt(config.programId);
  if (!programId) {
    throw new Error("Empresa do Programa de Integração é obrigatória quando o acesso estiver habilitado.");
  }
  if (config.ugpResponsible && config.accessLevel !== "ugp") {
    throw new Error("O responsável UGP/RH oficial precisa ter nível de acesso UGP/RH.");
  }

  const permissions = [
    INTEGRACAO_ROUTE_PERMISSION,
    `${INTEGRACAO_PROGRAM_PREFIX}${programId}`,
    `${INTEGRACAO_ACCESS_PREFIX}${config.accessLevel}`,
    `${INTEGRACAO_MODE_PREFIX}${config.mode}`,
  ];

  // Compatibilidade temporária com leituras antigas ainda existentes fora deste módulo.
  if (config.mode === "all") permissions.push("scope:integracao:all");
  if (config.demoOnly) permissions.push(INTEGRACAO_DEMO_ONLY);
  if (config.ugpResponsible) permissions.push(INTEGRACAO_UGP_RESPONSIBLE);

  if (config.mode === "manual") {
    const processIds = Array.from(new Set(
      (config.processIds || [])
        .map(positiveInt)
        .filter((id): id is number => id !== null),
    )).sort((a, b) => a - b);

    processIds.forEach((processId) => {
      permissions.push(`${INTEGRACAO_PROCESS_PREFIX}${processId}`);
    });
  }

  return permissions;
}

export function replaceIntegracaoPermissions(
  currentPermissions: string[],
  config: {
    enabled: boolean;
    programId: number | null;
    accessLevel: IntegracaoAccessLevel;
    mode: IntegracaoManagerMode;
    processIds?: number[];
    demoOnly?: boolean;
    ugpResponsible?: boolean;
  },
): string[] {
  const preserved = (currentPermissions || []).filter((permission) => !isIntegracaoPermissionToken(permission));
  const integration = buildManagerIntegracaoPermissions(config);
  return Array.from(new Set([...preserved, ...integration]));
}

export function mergeGeneralManagerPermissionsPreservingIntegracao(
  currentPermissions: string[],
  nextGeneralPermissions: string[],
): string[] {
  const current = Array.isArray(currentPermissions) ? currentPermissions.filter(Boolean) : [];
  const nextGeneral = Array.isArray(nextGeneralPermissions) ? nextGeneralPermissions.filter(Boolean) : [];

  // Configurações antigas continuam com o comportamento histórico até serem
  // migradas explicitamente para a configuração independente da Integração.
  if (!hasIndependentIntegracaoConfig(current)) {
    return Array.from(new Set(nextGeneral));
  }

  const integration = current.filter(isIntegracaoPermissionToken);
  const generalOnly = nextGeneral.filter((permission) => !isIntegracaoPermissionToken(permission));
  return Array.from(new Set([...generalOnly, ...integration]));
}

export type IntegracaoManagerMode = "gestor" | "all" | "manual";

export type ManagerIntegracaoConfig = {
  enabled: boolean;
  programId: number | null;
  mode: IntegracaoManagerMode;
  processIds: number[];
  legacyScopeAll: boolean;
};

const INTEGRACAO_ROUTE_PERMISSION = "/gestor/integracao";
const INTEGRACAO_SCOPE_PREFIX = "scope:integracao:";
const INTEGRACAO_PROGRAM_PREFIX = "scope:integracao:program:";
const INTEGRACAO_MODE_PREFIX = "scope:integracao:mode:";
const INTEGRACAO_PROCESS_PREFIX = "scope:integracao:process:";

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

  const programToken = safePermissions.find((permission) => permission.startsWith(INTEGRACAO_PROGRAM_PREFIX));
  const programId = programToken
    ? positiveInt(programToken.slice(INTEGRACAO_PROGRAM_PREFIX.length))
    : null;

  const modeToken = safePermissions.find((permission) => permission.startsWith(INTEGRACAO_MODE_PREFIX));
  const rawMode = modeToken?.slice(INTEGRACAO_MODE_PREFIX.length);
  const mode: IntegracaoManagerMode =
    rawMode === "manual" || rawMode === "all" || rawMode === "gestor"
      ? rawMode
      : legacyScopeAll
        ? "all"
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
    mode,
    processIds,
    legacyScopeAll,
  };
}

export function buildManagerIntegracaoPermissions(config: {
  enabled: boolean;
  programId: number | null;
  mode: IntegracaoManagerMode;
  processIds?: number[];
}): string[] {
  if (!config.enabled) return [];

  const programId = positiveInt(config.programId);
  if (!programId) {
    throw new Error("Empresa do Programa de Integração é obrigatória quando o acesso estiver habilitado.");
  }

  const permissions = [
    INTEGRACAO_ROUTE_PERMISSION,
    `${INTEGRACAO_PROGRAM_PREFIX}${programId}`,
    `${INTEGRACAO_MODE_PREFIX}${config.mode}`,
  ];

  // Compatibilidade temporária com a lógica antiga, que ainda reconhece este token.
  if (config.mode === "all") permissions.push("scope:integracao:all");

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
    mode: IntegracaoManagerMode;
    processIds?: number[];
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

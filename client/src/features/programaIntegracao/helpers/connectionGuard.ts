export function navegadorEstaOnline(): boolean {
  if (typeof navigator === 'undefined') return true;
  return navigator.onLine !== false;
}

export function exigirConexaoParaAlterar(): void {
  if (navegadorEstaOnline()) return;
  throw new Error(
    'Sem conexão com o servidor. Nenhuma alteração foi enviada. Reconecte e tente novamente para evitar trabalhar sobre dados desatualizados.',
  );
}

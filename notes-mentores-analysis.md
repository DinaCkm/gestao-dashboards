# Análise Mentores no Banco

Total: 14 registros (todos isActive=1)
- 10 mentores (role=mentor)
- 4 gerentes (role=gerente): Emanoel x2, gerente teste, Joseane

Mentores com canLogin=0 (sem acesso ao sistema):
- Deborah Franco (id=31) - sem email, CPF, loginId
- Dina Makiyama (id=37) - sem email, CPF, loginId  
- Equipe CKM Talents (id=14) - sem email, CPF, loginId
- Giovanna Braga Schmitz (id=30) - sem email, CPF, loginId
- Gislaine Fabiola (id=36) - sem email, CPF, loginId

Dashboard mostra 14 (getConsultors retorna TODOS incluindo gerentes)
Cadastros mostra 12 (mentor.list filtra role=mentor + isActive=1, mas todos estão ativos)

O .slice(0,6) no Dashboard limita cards a 6
O dashboardGeral usa getConsultors() que retorna todos (mentores + gerentes)
Mas os cards só mostram os que têm stats (sessões), por isso só 6 aparecem
Os outros 8 (4 mentores sem sessões + 4 gerentes) não aparecem como cards

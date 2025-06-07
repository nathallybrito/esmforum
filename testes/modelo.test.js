const bd = require('../bd/bd_utils.js');
const modelo = require('../modelo.js');

// Mock do bd para alguns testes
const mockBd = {
  queryAll: jest.fn(),
  query: jest.fn(),
  exec: jest.fn()
};

beforeEach(() => {
  bd.reconfig('./bd/esmforum-teste.db');
  // limpa dados de todas as tabelas
  bd.exec('delete from perguntas', []);
  bd.exec('delete from respostas', []);
});

test('Testando banco de dados vazio', () => {
  expect(modelo.listar_perguntas().length).toBe(0);
});

test('Testando cadastro de três perguntas', () => {
  modelo.cadastrar_pergunta('1 + 1 = ?');
  modelo.cadastrar_pergunta('2 + 2 = ?');
  modelo.cadastrar_pergunta('3 + 3 = ?');
  const perguntas = modelo.listar_perguntas(); 
  expect(perguntas.length).toBe(3);
  expect(perguntas[0].texto).toBe('1 + 1 = ?');
  expect(perguntas[1].texto).toBe('2 + 2 = ?');
  expect(perguntas[2].num_respostas).toBe(0);
  expect(perguntas[1].id_pergunta).toBe(perguntas[2].id_pergunta-1);
});

// Novos testes para aumentar a cobertura para 100%

test('Testando cadastro_resposta', () => {
  const id_pergunta = modelo.cadastrar_pergunta('Pergunta de teste');
  const id_resposta = modelo.cadastrar_resposta(id_pergunta, 'Resposta de teste');
  expect(id_resposta).toBeDefined();
  
  // Verificar se a resposta foi cadastrada
  const respostas = modelo.get_respostas(id_pergunta);
  expect(respostas.length).toBe(1);
  expect(respostas[0].texto).toBe('Resposta de teste');
});

test('Testando get_pergunta', () => {
  const id_pergunta = modelo.cadastrar_pergunta('Pergunta de teste');
  const pergunta = modelo.get_pergunta(id_pergunta);
  expect(pergunta).toBeDefined();
  expect(pergunta.texto).toBe('Pergunta de teste');
  expect(pergunta.id_usuario).toBe(1);
});

test('Testando get_respostas', () => {
  const id_pergunta = modelo.cadastrar_pergunta('Pergunta para respostas');
  
  // Verificar pergunta sem respostas
  let respostas = modelo.get_respostas(id_pergunta);
  expect(respostas.length).toBe(0);
  
  // Adicionar respostas e verificar
  modelo.cadastrar_resposta(id_pergunta, 'Resposta 1');
  modelo.cadastrar_resposta(id_pergunta, 'Resposta 2');
  
  respostas = modelo.get_respostas(id_pergunta);
  expect(respostas.length).toBe(2);
  expect(respostas[0].texto).toBe('Resposta 1');
  expect(respostas[1].texto).toBe('Resposta 2');
});

test('Testando get_num_respostas', () => {
  const id_pergunta = modelo.cadastrar_pergunta('Pergunta para contar respostas');
  
  // Sem respostas
  expect(modelo.get_num_respostas(id_pergunta)).toBe(0);
  
  // Com respostas
  modelo.cadastrar_resposta(id_pergunta, 'R1');
  modelo.cadastrar_resposta(id_pergunta, 'R2');
  modelo.cadastrar_resposta(id_pergunta, 'R3');
  
  expect(modelo.get_num_respostas(id_pergunta)).toBe(3);
});

test('Testando reconfig_bd', () => {
  // Configurar o mock
  mockBd.queryAll.mockReturnValue([
    { id_pergunta: 42, texto: 'Pergunta mockada', id_usuario: 99 }
  ]);
  mockBd.query.mockReturnValue({ 'count(*)': 7 });
  
  // Usar o mock no lugar do bd real
  modelo.reconfig_bd(mockBd);
  
  const perguntas = modelo.listar_perguntas();
  expect(perguntas.length).toBe(1);
  expect(perguntas[0].id_pergunta).toBe(42);
  expect(perguntas[0].texto).toBe('Pergunta mockada');
  expect(perguntas[0].num_respostas).toBe(7);
  
  // Verificar se o mock foi chamado corretamente
  expect(mockBd.queryAll).toHaveBeenCalledWith('select * from perguntas', []);
  expect(mockBd.query).toHaveBeenCalledWith('select count(*) from respostas where id_pergunta = ?', [42]);
  
  // Restaurar o bd original
  modelo.reconfig_bd(bd);
});

test('Testando listar_perguntas com múltiplas respostas', () => {
  // Criar perguntas e respostas
  const id_pergunta1 = modelo.cadastrar_pergunta('P1');
  const id_pergunta2 = modelo.cadastrar_pergunta('P2');
  
  modelo.cadastrar_resposta(id_pergunta1, 'R1-1');
  modelo.cadastrar_resposta(id_pergunta1, 'R1-2');
  modelo.cadastrar_resposta(id_pergunta2, 'R2-1');
  
  // Verificar se o número de respostas está correto na listagem
  const perguntas = modelo.listar_perguntas();
  const p1 = perguntas.find(p => p.id_pergunta === id_pergunta1);
  const p2 = perguntas.find(p => p.id_pergunta === id_pergunta2);
  
  expect(p1.num_respostas).toBe(2);
  expect(p2.num_respostas).toBe(1);
});

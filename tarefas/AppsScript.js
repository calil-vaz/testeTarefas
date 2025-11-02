/**
 * Google Apps Script (Web App) - Simulação
 * Este código deve ser copiado e configurado como um Web App no Google Sheets.
 * O ID da planilha deve ser atualizado.
 */

const SPREADSHEET_ID = 'SEU_ID_DA_PLANILHA_AQUI'; // Substitua pelo ID real da sua planilha
const SHEET_NAME = 'Tarefas';

/**
 * Função principal para servir o HTML (doGet) ou processar requisições (doPost).
 * @param {Object} e - Objeto de evento do Apps Script.
 * @returns {HtmlOutput|ContentService.TextOutput}
 */
function doGet(e) {
  // Serve o arquivo index.html
  return HtmlService.createHtmlOutputFromFile('index')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function doPost(e) {
  const action = e.parameter.action;
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);

  try {
    switch (action) {
      case 'createTask':
        return handleCreateTask(e.parameter, sheet);
      case 'getTasks':
        return handleGetTasks(sheet);
      case 'updateTask':
        return handleUpdateTask(e.parameter, sheet);
      case 'exportJson':
        return handleExportJson(sheet);
      default:
        return createResponse(false, 'Ação desconhecida.');
    }
  } catch (error) {
    Logger.log(error);
    return createResponse(false, 'Erro interno do servidor: ' + error.message);
  }
}

/**
 * Cria uma resposta padronizada para o frontend.
 * @param {boolean} success - Indica se a operação foi bem-sucedida.
 * @param {string|Object} data - Mensagem ou dados de retorno.
 * @returns {ContentService.TextOutput}
 */
function createResponse(success, data) {
  const output = { success: success, data: data };
  return ContentService.createTextOutput(JSON.stringify(output))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Gera um ID de tarefa único (T-{LOJA}-{SEQUENCIAL}).
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - A planilha de tarefas.
 * @param {string} loja - O código da loja.
 * @returns {string} O ID da tarefa gerado.
 */
function generateTaskId(sheet, loja) {
  const lastRow = sheet.getLastRow();
  let nextSequential = 1;

  if (lastRow > 1) {
    const lastId = sheet.getRange(lastRow, 1).getValue(); // Coluna 1 é ID_TAREFA
    const match = lastId.match(/T-\d+-(\d+)/);
    if (match) {
      nextSequential = parseInt(match[1]) + 1;
    }
  }

  return `T-${loja}-${String(nextSequential).padStart(3, '0')}`;
}

/**
 * Manipula a criação de uma nova tarefa.
 * @param {Object} params - Parâmetros da requisição (loja, solicitante, titulo, descricao).
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - A planilha de tarefas.
 * @returns {ContentService.TextOutput}
 */
function handleCreateTask(params, sheet) {
  const { loja, solicitante, titulo, descricao } = params;

  if (!loja || !solicitante || !titulo || !descricao) {
    return createResponse(false, 'Todos os campos são obrigatórios.');
  }

  const taskId = generateTaskId(sheet, loja);
  const now = new Date();
  const status = 'PENDENTE';

  // Estrutura da linha: ID_TAREFA, DATA_SOLICITACAO, LOJA, SOLICITANTE, TITULO, DESCRICAO, STATUS, OS_SS, DATA_OS_SS, TECNICO
  const newRow = [
    taskId,
    now,
    loja,
    solicitante,
    titulo,
    descricao,
    status,
    '', // OS_SS
    '', // DATA_OS_SS
    ''  // TECNICO
  ];

  sheet.appendRow(newRow);

  return createResponse(true, { message: 'Tarefa criada com sucesso!', taskId: taskId });
}

/**
 * Retorna todas as tarefas da planilha.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - A planilha de tarefas.
 * @returns {ContentService.TextOutput}
 */
function handleGetTasks(sheet) {
  const range = sheet.getDataRange();
  const values = range.getValues();
  
  if (values.length <= 1) {
    return createResponse(true, []);
  }

  const headers = values[0];
  const data = values.slice(1).map(row => {
    const task = {};
    headers.forEach((header, i) => {
      task[header] = row[i];
    });
    return task;
  });

  return createResponse(true, data);
}

/**
 * Manipula a atualização de uma tarefa pelo técnico.
 * @param {Object} params - Parâmetros da requisição (taskId, osSs, tecnico).
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - A planilha de tarefas.
 * @returns {ContentService.TextOutput}
 */
function handleUpdateTask(params, sheet) {
  const { taskId, osSs, tecnico } = params;

  if (!taskId || !osSs || !tecnico) {
    return createResponse(false, 'ID da Tarefa, O.S./S.S. e Técnico são obrigatórios para atualização.');
  }

  const range = sheet.getDataRange();
  const values = range.getValues();
  const headers = values[0];
  const taskIdIndex = headers.indexOf('ID_TAREFA');
  const osSsIndex = headers.indexOf('OS_SS');
  const dataOsSsIndex = headers.indexOf('DATA_OS_SS');
  const tecnicoIndex = headers.indexOf('TECNICO');
  const statusIndex = headers.indexOf('STATUS');

  if (taskIdIndex === -1 || osSsIndex === -1 || tecnicoIndex === -1 || statusIndex === -1) {
    return createResponse(false, 'Estrutura da planilha inválida. Verifique os cabeçalhos.');
  }

  for (let i = 1; i < values.length; i++) {
    if (values[i][taskIdIndex] === taskId) {
      const row = i + 1;
      
      // Atualiza OS_SS, DATA_OS_SS, TECNICO e STATUS
      sheet.getRange(row, osSsIndex + 1).setValue(osSs);
      sheet.getRange(row, dataOsSsIndex + 1).setValue(new Date());
      sheet.getRange(row, tecnicoIndex + 1).setValue(tecnico);
      sheet.getRange(row, statusIndex + 1).setValue('EM_ANDAMENTO'); // Altera status para EM_ANDAMENTO

      return createResponse(true, { message: `Tarefa ${taskId} atualizada com sucesso!` });
    }
  }

  return createResponse(false, `Tarefa com ID ${taskId} não encontrada.`);
}

/**
 * Exporta todos os dados da planilha em formato JSON.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - A planilha de tarefas.
 * @returns {ContentService.TextOutput}
 */
function handleExportJson(sheet) {
  const range = sheet.getDataRange();
  const values = range.getValues();
  
  if (values.length <= 1) {
    return createResponse(true, []);
  }

  const headers = values[0];
  const data = values.slice(1).map(row => {
    const task = {};
    headers.forEach((header, i) => {
      // Formata datas para string ISO para consumo externo
      if (row[i] instanceof Date) {
        task[header] = row[i].toISOString();
      } else {
        task[header] = row[i];
      }
    });
    return task;
  });

  // Retorna o JSON puro, sem o envelope {success: true, data: ...}
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// Funções auxiliares para simular a criação da planilha e cabeçalhos (apenas para referência)
function setupSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }

  const headers = [
    'ID_TAREFA', 'DATA_SOLICITACAO', 'LOJA', 'SOLICITANTE', 'TITULO', 
    'DESCRICAO', 'STATUS', 'OS_SS', 'DATA_OS_SS', 'TECNICO'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
}

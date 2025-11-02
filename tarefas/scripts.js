/**
 * Sistema de Gestão de Tarefas de Manutenção - Frontend
 * Desenvolvido para o Grupo Pereira
 * 
 * IMPORTANTE: Substitua a URL do Web App pela URL real gerada no Google Apps Script
 */

// ========== CONFIGURAÇÃO ==========
// URL do Web App fornecida pelo usuário
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzOY7tqUXyPhXIo7zWkevIVpX-JZEFdBLlf2-sYl_PFZIIpW6DDunTGadmAUXtZJ64A6g/exec';
const STORES = [11, 85, 115, 135, 165, 182, 183, 187, 190, 194, 195, 198, 213, 214, 223, 225, 250, 255, 270, 294, 295, 305, 309, 310, 325, 335, 375, 384, 385, 405, 420, 479, 480, 492, 561, 825, 897, 905];

// ========== ESTADO GLOBAL ==========
let currentUser = {
    store: null,
    role: null,
    name: null
};

let allTasks = [];
let filteredTasks = [];

// ========== INICIALIZAÇÃO ==========
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Verificar se há usuário logado
    const savedUser = localStorage.getItem('currentUser');
    
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            showScreen(currentUser.role);
            loadTasks();
        } catch (error) {
            console.error('Erro ao recuperar usuário:', error);
            showScreen('login');
        }
    } else {
        showScreen('login');
    }

    // Event Listeners
    setupEventListeners();
}

function setupEventListeners() {
    // Login
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Gerente
    const gerenteForm = document.getElementById('gerente-form');
    if (gerenteForm) {
        gerenteForm.addEventListener('submit', handleCreateTask);
    }

    const gerenteLogout = document.getElementById('gerente-logout');
    if (gerenteLogout) {
        gerenteLogout.addEventListener('click', handleLogout);
    }

    const gerenteRefresh = document.getElementById('gerente-refresh');
    if (gerenteRefresh) {
        gerenteRefresh.addEventListener('click', loadTasks);
    }

    // Técnico
    const tecnicoLogout = document.getElementById('tecnico-logout');
    if (tecnicoLogout) {
        tecnicoLogout.addEventListener('click', handleLogout);
    }

    const tecnicoRefresh = document.getElementById('tecnico-refresh');
    if (tecnicoRefresh) {
        tecnicoRefresh.addEventListener('click', loadTasks);
    }

    const tecnicoStatusFilter = document.getElementById('tecnico-status-filter');
    if (tecnicoStatusFilter) {
        tecnicoStatusFilter.addEventListener('change', filterTasks);
    }

    const tecnicoSearch = document.getElementById('tecnico-search');
    if (tecnicoSearch) {
        tecnicoSearch.addEventListener('input', filterTasks);
    }

    // Modal
    const updateOsModal = document.getElementById('update-os-modal');
    const modalCloseButtons = document.querySelectorAll('.modal-close, .modal-close-btn');
    
    modalCloseButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            updateOsModal.classList.remove('active');
        });
    });

    const updateOsForm = document.getElementById('update-os-form');
    if (updateOsForm) {
        updateOsForm.addEventListener('submit', handleUpdateOs);
    }

    // Fechar modal ao clicar fora
    updateOsModal.addEventListener('click', (e) => {
        if (e.target === updateOsModal) {
            updateOsModal.classList.remove('active');
        }
    });
}

// ========== AUTENTICAÇÃO ==========
function handleLogin(e) {
    e.preventDefault();

    const store = document.getElementById('login-store').value;
    const role = document.getElementById('login-role').value;
    const name = document.getElementById('login-name').value;

    if (!store || !role || !name) {
        showToast('Por favor, preencha todos os campos!', 'error');
        return;
    }

    if (!STORES.includes(parseInt(store))) {
        showToast('Código de loja inválido!', 'error');
        return;
    }

    currentUser = {
        store: store,
        role: role,
        name: name
    };

    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    showScreen(role);
    loadTasks();
    showToast(`Bem-vindo, ${name}!`, 'success');
}

function handleLogout() {
    if (confirm('Deseja realmente sair?')) {
        localStorage.removeItem('currentUser');
        currentUser = { store: null, role: null, name: null };
        showScreen('login');
        showToast('Você foi desconectado!', 'success');
    }
}

// ========== NAVEGAÇÃO DE TELAS ==========
function showScreen(screenName) {
    // Ocultar todas as telas
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });

    // Mostrar tela selecionada
    const screen = document.getElementById(`${screenName}-screen`);
    if (screen) {
        screen.classList.add('active');
    }

    // Atualizar informações do usuário
    if (screenName === 'gerente') {
        const userInfo = document.getElementById('gerente-user-info');
        if (userInfo) {
            userInfo.innerHTML = `<i class="fas fa-user"></i> ${currentUser.name} (Loja ${currentUser.store})`;
        }
    } else if (screenName === 'tecnico') {
        const userInfo = document.getElementById('tecnico-user-info');
        if (userInfo) {
            userInfo.innerHTML = `<i class="fas fa-user"></i> ${currentUser.name} (Loja ${currentUser.store})`;
        }
    }
}

// ========== CRUD - CRIAR TAREFA ==========
function handleCreateTask(e) {
    e.preventDefault();

    const titulo = document.getElementById('gerente-titulo').value;
    const descricao = document.getElementById('gerente-descricao').value;

    if (!titulo || !descricao) {
        showToast('Por favor, preencha todos os campos!', 'error');
        return;
    }

    const payload = {
        action: 'createTask',
        loja: currentUser.store,
        solicitante: currentUser.name,
        titulo: titulo,
        descricao: descricao
    };

    // Mostrar loading
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';

    fetch(WEB_APP_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json' // Importante: Enviar como JSON
        },
        body: JSON.stringify(payload) // Enviar o payload como string JSON
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showToast(`Tarefa criada com sucesso! ID: ${data.data.taskId}`, 'success');
            document.getElementById('gerente-form').reset();
            loadTasks();
        } else {
            showToast(`Erro: ${data.data}`, 'error');
        }
    })
    .catch(error => {
        console.error('Erro ao criar tarefa:', error);
        showToast('Erro ao conectar com o servidor!', 'error');
    })
    .finally(() => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    });
}

// ========== CRUD - CARREGAR TAREFAS ==========
function loadTasks() {
    // CORREÇÃO: Voltando a usar POST para carregar tarefas, pois o Apps Script foi corrigido para aceitar POST com JSON
    const payload = {
        action: 'getTasks'
    };

    fetch(WEB_APP_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            allTasks = data.data || [];
            
            if (currentUser.role === 'gerente') {
                // Filtrar apenas tarefas da loja do gerente
                filteredTasks = allTasks.filter(task => task.LOJA == currentUser.store);
                renderGerenteTasks();
            } else if (currentUser.role === 'tecnico') {
                // Técnico vê todas as tarefas (ou apenas da sua loja, conforme preferência)
                filteredTasks = allTasks.filter(task => task.LOJA == currentUser.store);
                renderTecnicoTasks();
                updateTecnicoDashboard();
            }
        } else {
            showToast('Erro ao carregar tarefas!', 'error');
        }
    })
    .catch(error => {
        console.error('Erro ao carregar tarefas:', error);
        showToast('Erro ao conectar com o servidor!', 'error');
    });
}

// ========== RENDERIZAR TAREFAS - GERENTE ==========
function renderGerenteTasks() {
    const tbody = document.getElementById('gerente-tasks-body');
    
    if (!tbody) return;

    if (filteredTasks.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;"><i class="fas fa-inbox"></i> Nenhuma solicitação ainda</td></tr>';
        return;
    }

    tbody.innerHTML = filteredTasks.map(task => {
        const date = formatDate(task.DATA_SOLICITACAO);
        const status = getStatusBadge(task.STATUS);
        const osSs = task.OS_SS || '-';
        const tecnico = task.TECNICO || '-';

        return `
            <tr>
                <td><strong>${task.ID_TAREFA}</strong></td>
                <td>${date}</td>
                <td>${task.TITULO}</td>
                <td>${status}</td>
                <td>${osSs}</td>
                <td>${tecnico}</td>
            </tr>
        `;
    }).join('');
}

// ========== RENDERIZAR TAREFAS - TÉCNICO ==========
function renderTecnicoTasks() {
    const tbody = document.getElementById('tecnico-tasks-body');
    
    if (!tbody) return;

    if (filteredTasks.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;"><i class="fas fa-inbox"></i> Nenhuma tarefa disponível</td></tr>';
        return;
    }

    tbody.innerHTML = filteredTasks.map(task => {
        const date = formatDate(task.DATA_SOLICITACAO);
        const status = getStatusBadge(task.STATUS);
        const osSs = task.OS_SS || '-';

        return `
            <tr>
                <td><strong>${task.ID_TAREFA}</strong></td>
                <td>${date}</td>
                <td>${task.TITULO}</td>
                <td>${task.SOLICITANTE}</td>
                <td>${status}</td>
                <td>${osSs}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="openUpdateOsModal('${task.ID_TAREFA}', '${task.TITULO}')">
                        <i class="fas fa-edit"></i> Atualizar
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// ========== DASHBOARD DO TÉCNICO ==========
function updateTecnicoDashboard() {
    const pending = filteredTasks.filter(t => t.STATUS === 'PENDENTE').length;
    const inProgress = filteredTasks.filter(t => t.STATUS === 'EM_ANDAMENTO').length;
    const completed = filteredTasks.filter(t => t.STATUS === 'CONCLUIDA').length;
    const withoutOs = filteredTasks.filter(t => !t.OS_SS || t.OS_SS === '').length;

    document.getElementById('tecnico-pending').textContent = pending;
    document.getElementById('tecnico-inprogress').textContent = inProgress;
    document.getElementById('tecnico-completed').textContent = completed;
    document.getElementById('tecnico-without-os').textContent = withoutOs;
}

// ========== FILTROS - TÉCNICO ==========
function filterTasks() {
    const statusFilter = document.getElementById('tecnico-status-filter').value;
    const searchFilter = document.getElementById('tecnico-search').value.toLowerCase();

    filteredTasks = allTasks
        .filter(task => task.LOJA == currentUser.store)
        .filter(task => {
            if (statusFilter && task.STATUS !== statusFilter) return false;
            if (searchFilter) {
                const searchableText = `${task.ID_TAREFA} ${task.TITULO} ${task.SOLICITANTE}`.toLowerCase();
                if (!searchableText.includes(searchFilter)) return false;
            }
            return true;
        });

    renderTecnicoTasks();
}

// ========== MODAL - ATUALIZAR O.S./S.S. ==========
function openUpdateOsModal(taskId, titulo) {
    document.getElementById('update-task-id').value = taskId;
    document.getElementById('update-titulo').value = titulo;
    document.getElementById('update-os-ss').value = '';
    document.getElementById('update-os-modal').classList.add('active');
}

function handleUpdateOs(e) {
    e.preventDefault();

    const taskId = document.getElementById('update-task-id').value;
    const osSs = document.getElementById('update-os-ss').value;

    if (!osSs) {
        showToast('Por favor, insira o número da O.S./S.S.!', 'error');
        return;
    }

    const payload = {
        action: 'updateTask',
        taskId: taskId,
        osSs: osSs,
        tecnico: currentUser.name
    };

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';

    fetch(WEB_APP_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showToast('O.S./S.S. atualizada com sucesso!', 'success');
            document.getElementById('update-os-modal').classList.remove('active');
            loadTasks();
        } else {
            showToast(`Erro: ${data.data}`, 'error');
        }
    })
    .catch(error => {
        console.error('Erro ao atualizar O.S./S.S.:', error);
        showToast('Erro ao conectar com o servidor!', 'error');
    })
    .finally(() => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    });
}

// ========== UTILITÁRIOS ==========
function formatDate(dateValue) {
    if (!dateValue) return '-';
    
    let date;
    if (typeof dateValue === 'string') {
        date = new Date(dateValue);
    } else if (dateValue instanceof Date) {
        date = dateValue;
    } else {
        return '-';
    }

    if (isNaN(date.getTime())) return '-';

    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getStatusBadge(status) {
    const statusMap = {
        'PENDENTE': '<span class="status-badge pending"><i class="fas fa-hourglass-start"></i> Pendente</span>',
        'EM_ANDAMENTO': '<span class="status-badge in-progress"><i class="fas fa-spinner"></i> Em Andamento</span>',
        'CONCLUIDA': '<span class="status-badge completed"><i class="fas fa-check-circle"></i> Concluída</span>'
    };

    return statusMap[status] || `<span class="status-badge">${status}</span>`;
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast show ${type}`;

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ========== EXPORTAR JSON (Para consumo externo) ==========
function exportTasksAsJson() {
    const payload = {
        action: 'exportJson'
    };

    fetch(WEB_APP_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(data => {
        // data já é um array JSON
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tarefas-manutencao-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('Arquivo JSON exportado com sucesso!', 'success');
    })
    .catch(error => {
        console.error('Erro ao exportar JSON:', error);
        showToast('Erro ao exportar dados!', 'error');
    });
}

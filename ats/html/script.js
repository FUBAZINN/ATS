// Dados dos attachments disponíveis
const attachmentsData = [
    { id: 'COMPONENT_AT_AR_FLSH', name: 'Lanterna Tática', type: 'Utilitário', icon: '🔦' },
    { id: 'COMPONENT_AT_AR_SUPP', name: 'Silenciador', type: 'Cano', icon: '🔇' },
    { id: 'COMPONENT_AT_SCOPE_MEDIUM', name: 'Mira Média', type: 'Mira', icon: '🔭' },
    { id: 'COMPONENT_AT_AR_AFGRIP', name: 'Grip Vertical', type: 'Empunhadura', icon: '🎯' },
    { id: 'COMPONENT_AT_AR_CLIP_02', name: 'Carregador Estendido', type: 'Munição', icon: '📦' },
    { id: 'COMPONENT_AT_PI_FLSH', name: 'Lanterna Pistola', type: 'Utilitário', icon: '🔦' },
    { id: 'COMPONENT_AT_PI_SUPP', name: 'Silenciador Pistola', type: 'Cano', icon: '🔇' },
    { id: 'COMPONENT_AT_SCOPE_LARGE', name: 'Mira Longa', type: 'Mira', icon: '🔭' }
];

// Estado
let currentWeapon = null;
let installedAttachments = [];

// Elementos DOM
const app = document.getElementById('app');
const weaponName = document.getElementById('weaponName');
const weaponHash = document.getElementById('weaponHash');
const attachmentsGrid = document.getElementById('attachmentsGrid');
const notification = document.getElementById('notification');
const closeBtn = document.getElementById('closeBtn');

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    renderAttachments();
    setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
    closeBtn.addEventListener('click', closeMenu);
    
    // Listener para mensagens do Lua
    window.addEventListener('message', (event) => {
        const data = event.data;
        
        switch(data.action) {
            case 'toggle':
                toggleMenu(data.show);
                break;
            case 'notify':
                showNotification(data.message, data.type);
                break;
            case 'updateWeapon':
                updateWeaponInfo(data.weapon);
                break;
            case 'updateInstalled':
                updateInstalledAttachments(data.attachments);
                break;
        }
    });
}

// Toggle Menu
function toggleMenu(show) {
    if (show) {
        app.classList.remove('hidden');
        setTimeout(() => app.classList.add('active'), 10);
        fetchWeaponInfo();
    } else {
        app.classList.remove('active');
        setTimeout(() => app.classList.add('hidden'), 300);
    }
}

// Fechar menu
function closeMenu() {
    fetch('https://' + GetParentResourceName() + '/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
    });
}

// Renderizar attachments
function renderAttachments() {
    attachmentsGrid.innerHTML = '';
    
    attachmentsData.forEach(attachment => {
        const card = createAttachmentCard(attachment);
        attachmentsGrid.appendChild(card);
    });
}

// Criar card de attachment
function createAttachmentCard(attachment) {
    const card = document.createElement('div');
    card.className = 'attachment-card';
    card.dataset.id = attachment.id;
    
    card.innerHTML = `
        <span class="attachment-status" id="status-${attachment.id}">○</span>
        <span class="attachment-icon">${attachment.icon}</span>
        <span class="attachment-name">${attachment.name}</span>
        <span class="attachment-type">${attachment.type}</span>
    `;
    
    card.addEventListener('click', () => toggleAttachment(attachment));
    
    return card;
}

// Toggle attachment (instalar/remover)
function toggleAttachment(attachment) {
    if (!currentWeapon || !currentWeapon.hasWeapon) {
        showNotification('Você precisa equipar uma arma primeiro!', 'error');
        return;
    }
    
    const isInstalled = installedAttachments.includes(attachment.id);
    
    if (isInstalled) {
        // Remover
        fetch('https://' + GetParentResourceName() + '/remove', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ component: attachment.id })
        });
    } else {
        // Instalar
        fetch('https://' + GetParentResourceName() + '/attach', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ component: attachment.id })
        });
    }
}

// Buscar info da arma
function fetchWeaponInfo() {
    fetch('https://' + GetParentResourceName() + '/getWeaponInfo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
    }).then(resp => resp.json()).then(data => {
        updateWeaponInfo(data);
    });
    
    fetchInstalledAttachments();
}

// Buscar attachments instalados
function fetchInstalledAttachments() {
    fetch('https://' + GetParentResourceName() + '/getInstalled', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
    }).then(resp => resp.json()).then(data => {
        updateInstalledAttachments(data);
    });
}

// Atualizar info da arma na UI
function updateWeaponInfo(weapon) {
    currentWeapon = weapon;
    
    if (weapon && weapon.hasWeapon) {
        weaponName.textContent = weapon.name || 'Arma Desconhecida';
        weaponHash.textContent = `HASH: ${weapon.hash || 'N/A'}`;
        document.querySelector('.weapon-icon').textContent = '🔫';
    } else {
        weaponName.textContent = 'Nenhuma arma equipada';
        weaponHash.textContent = 'Equip uma arma para ver os attachments';
        document.querySelector('.weapon-icon').textContent = '❌';
    }
}

// Atualizar attachments instalados na UI
function updateInstalledAttachments(attachments) {
    installedAttachments = attachments || [];
    
    // Resetar todos os cards
    document.querySelectorAll('.attachment-card').forEach(card => {
        card.classList.remove('installed');
        const status = card.querySelector('.attachment-status');
        status.textContent = '○';
        status.style.color = 'var(--text-secondary)';
    });
    
    // Marcar instalados
    installedAttachments.forEach(id => {
        const card = document.querySelector(`[data-id=\"${id}\"]`);
        if (card) {
            card.classList.add('installed');
            const status = card.querySelector('.attachment-status');
            status.textContent = '●';
            status.style.color = 'var(--cyan-primary)';
        }
    });
}

// Mostrar notificação
function showNotification(message, type = 'success') {
    notification.textContent = message;
    notification.className = `notification ${type} show`;
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Função auxiliar para obter nome do resource
const resourceName = window.GetParentResourceName ? window.GetParentResourceName() : 'ats';

function GetParentResourceName() {
    return resourceName;
}
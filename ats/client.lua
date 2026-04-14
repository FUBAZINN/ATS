local menuActive = false

-- Inicialização
AddEventHandler('onResourceStart', function(resourceName)
    if GetCurrentResourceName() == resourceName then
    end
end)

-- Comando para abrir/fechar
RegisterCommand("ats", function()
    menuActive = not menuActive
    SetNuiFocus(menuActive, menuActive)
    SendNUIMessage({
        action = "toggle",
        show = menuActive
    })
end)

-- Fechar pelo NUI
RegisterNUICallback("close", function(data, cb)
    menuActive = false
    SetNuiFocus(false, false)
    SendNUIMessage({
        action = "toggle",
        show = false
    })
    cb("ok")
end)

-- Fechar com ESC
Citizen.CreateThread(function()
    while true do
        Citizen.Wait(0)
        if menuActive then
            if IsControlJustPressed(0, 200) then -- ESC key
                menuActive = false
                SetNuiFocus(false, false)
                SendNUIMessage({
                    action = "toggle",
                    show = false
                })
            end
        end
    end
end)

-- Obter informação da arma atual
RegisterNUICallback("getWeaponInfo", function(data, cb)
    local ped = PlayerPedId()
    local weapon = GetSelectedPedWeapon(ped)
    local weaponName = GetWeaponNiceName(weapon)
    
    cb({
        hasWeapon = weapon ~= `WEAPON_UNARMED`,
        name = weaponName,
        hash = weapon
    })
end)

-- Instalar acessório
RegisterNUICallback("attach", function(data, cb)
    local ped = PlayerPedId()
    local weapon = GetSelectedPedWeapon(ped)
    local componentHash = GetHashKey(data.component)
    
    if weapon ~= `WEAPON_UNARMED` then
        if not HasPedGotWeaponComponent(ped, weapon, componentHash) then
            GiveWeaponComponentToPed(ped, weapon, componentHash)
            SendNUIMessage({
                action = "notify",
                message = "✓ Attachment installed successfully!",
                type = "success"
            })
        else
            SendNUIMessage({
                action = "notify",
                message = "⚠ Attachment already installed!",
                type = "warning"
            })
        end
    else
        SendNUIMessage({
            action = "notify",
            message = "✗ You need to equip a weapon first!",
            type = "error"
        })
    end
    
    cb("ok")
end)

-- Remover acessório
RegisterNUICallback("remove", function(data, cb)
    local ped = PlayerPedId()
    local weapon = GetSelectedPedWeapon(ped)
    local componentHash = GetHashKey(data.component)
    
    if weapon ~= `WEAPON_UNARMED` then
        if HasPedGotWeaponComponent(ped, weapon, componentHash) then
            RemoveWeaponComponentFromPed(ped, weapon, componentHash)
            SendNUIMessage({
                action = "notify",
                message = "✓ Attachment removed successfully!",
                type = "success"
            })
        else
            SendNUIMessage({
                action = "notify",
                message = "⚠ Attachment not installed!",
                type = "warning"
            })
        end
    end
    
    cb("ok")
end)

-- Obter acessórios instalados
RegisterNUICallback("getInstalled", function(data, cb)
    local ped = PlayerPedId()
    local weapon = GetSelectedPedWeapon(ped)
    local installed = {}
    
    if weapon ~= `WEAPON_UNARMED` then
        local components = {
            "COMPONENT_AT_AR_FLSH",
            "COMPONENT_AT_AR_SUPP",
            "COMPONENT_AT_SCOPE_MEDIUM",
            "COMPONENT_AT_AR_AFGRIP",
            "COMPONENT_AT_AR_CLIP_02",
            "COMPONENT_AT_PI_FLSH",
            "COMPONENT_AT_PI_SUPP",
            "COMPONENT_AT_SCOPE_LARGE"
        }
        
        for _, comp in ipairs(components) do
            if HasPedGotWeaponComponent(ped, weapon, GetHashKey(comp)) then
                table.insert(installed, comp)
            end
        end
    end
    
    cb(installed)
end)

-- Função para nome bonito das armas
function GetWeaponNiceName(hash)
    local weapons = {
        [`WEAPON_PISTOL`] = "Pistol",
        [`WEAPON_PISTOL_MK2`] = "Pistol MK2",
        [`WEAPON_COMBATPISTOL`] = "Combat Pistol",
        [`WEAPON_ASSAULTRIFLE`] = "Assault Rifle",
        [`WEAPON_ASSAULTRIFLE_MK2`] = "Assault Rifle MK2",
        [`WEAPON_CARBINERIFLE`] = "Carbine Rifle",
        [`WEAPON_CARBINERIFLE_MK2`] = "Carbine Rifle MK2",
        [`WEAPON_ADVANCEDRIFLE`] = "Advanced Rifle",
        [`WEAPON_SMG`] = "SMG",
        [`WEAPON_SMG_MK2`] = "SMG MK2",
        [`WEAPON_ASSAULTSMG`] = "Assault SMG",
        [`WEAPON_SHOTGUN`] = "Shotgun",
        [`WEAPON_ASSAULTSHOTGUN`] = "Assault Shotgun",
        [`WEAPON_SNIPERRIFLE`] = "Sniper Rifle",
        [`WEAPON_HEAVYSNIPER`] = "Heavy Sniper",
        [`WEAPON_MICROSMG`] = "Micro SMG",
        [`WEAPON_MINISMG`] = "Mini SMG",
        [`WEAPON_MACHINEPISTOL`] = "Machine Pistol"
    }
    return weapons[hash] or "Unknown Weapon"
end

-- Bloquear controles quando menu está aberto
Citizen.CreateThread(function()
    while true do
        if menuActive then
            DisableControlAction(0, 1, true)  -- Look left/right
            DisableControlAction(0, 2, true)  -- Look up/down
            DisableControlAction(0, 24, true) -- Attack
            DisableControlAction(0, 25, true) -- Aim
            DisableControlAction(0, 68, true) -- Jump
            DisableControlAction(0, 69, true) -- Sprint
            DisableControlAction(0, 70, true) -- Walk
            DisableControlAction(0, 71, true) -- Vehicle accelerate
            DisableControlAction(0, 72, true) -- Vehicle brake
        end
        Citizen.Wait(0)
    end
end)
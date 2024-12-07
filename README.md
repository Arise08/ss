-- Updated Pet Level System
local Players = game:GetService("Players")
local LocalPlayer = Players.LocalPlayer

-- Debug print
local function debugPrint(...)
    print(string.format("[Debug] %s", table.concat({...}, " ")))
end

-- Find remote
local function findRemote()
    for _, v in pairs(getgc(true)) do
        if type(v) == "table" then
            for key, value in pairs(v) do
                if type(value) == "function" and islclosure(value) then
                    local constants = debug.getconstants(value)
                    for _, constant in pairs(constants) do
                        if tostring(constant) == "FireServer" then
                            for _, upvalue in pairs(debug.getupvalues(value)) do
                                if typeof(upvalue) == "Instance" and upvalue:IsA("RemoteEvent") then
                                    debugPrint("Found remote:", upvalue.Name)
                                    return upvalue
                                end
                            end
                        end
                    end
                end
            end
        end
    end
    return nil
end

-- Initialize system
local function initPetSystem()
    local remote = findRemote()
    if not remote then
        warn("Failed to find remote!")
        return
    end

    -- Fire remote with exact pattern from spy
    local function fireRemote(action, ...)
        local args = {...}
        debugPrint("Firing remote with args:", action, unpack(args))
        remote:FireServer(action, unpack(args))
    end

    -- Get pet IDs
    local function getPetIds()
        local pets = {}
        for _, pet in pairs(workspace.Pets:GetChildren()) do
            if pet:FindFirstChild("GUID") and 
               pet:FindFirstChild("Owner") and 
               pet.Owner.Value == LocalPlayer then
                local guid = pet.GUID.Value
                if guid then
                    table.insert(pets, {
                        id = guid,
                        name = pet.Name,
                        model = pet
                    })
                    debugPrint("Found pet:", guid)
                end
            end
        end
        return pets
    end

    -- Add XP to pet using observed patterns
    local function addXPToPet(petId, xpAmount)
        debugPrint("Attempting to add XP to pet:", petId)
        
        -- Try AddPetToAutoDelete first
        fireRemote("AddPetToAutoDelete", petId)
        task.wait(0.1)
        
        -- Try multiple XP adding patterns
        fireRemote("AddXP", LocalPlayer, xpAmount)
        task.wait(0.1)
        fireRemote("AddXP", petId, xpAmount)
        task.wait(0.1)
        fireRemote("AddXP", {
            petId = petId,
            amount = xpAmount,
            player = LocalPlayer
        })
    end

    -- Test remote connection
    local function testRemote()
        debugPrint("Testing remote pattern...")
        fireRemote("TestConnection")
        
        -- Also try some key actions
        local pets = getPetIds()
        if #pets > 0 then
            local testPet = pets[1]
            debugPrint("Testing with pet:", testPet.id)
            
            fireRemote("AddPetToAutoDelete", testPet.id)
            task.wait(0.1)
            
            -- Try different XP values
            local testXP = 100
            fireRemote("AddXP", LocalPlayer, testXP)
            task.wait(0.1)
            fireRemote("AddXP", testPet.id, testXP)
        end
    end

    return {
        levelUpPet = addXPToPet,
        getPetIds = getPetIds,
        testRemote = testRemote,
        fireRemote = fireRemote  -- Exposed for testing
    }
end

return initPetSystem()

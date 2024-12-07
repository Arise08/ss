-- Fixed Remote Pattern System
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

    -- Direct remote call matching spy pattern
    local function fireRemote(action)
        debugPrint("Firing remote with action:", action)
        remote:FireServer(action)
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

    -- Add XP to pet using correct pattern
    local function addXPToPet(petId, xpAmount)
        debugPrint("Attempting to add XP to pet:", petId)
        -- Register pet
        fireRemote("AddPetToAutoDelete")
        task.wait(0.1)
        -- Add XP using correct pattern
        fireRemote("AddXP")
    end

    -- Level all pets
    local function levelUpAllPets(xpAmount)
        local pets = getPetIds()
        if #pets == 0 then
            warn("No pets found!")
            return
        end

        for _, pet in ipairs(pets) do
            debugPrint("Processing pet:", pet.id)
            addXPToPet(pet.id, xpAmount)
            task.wait(0.5)
        end
    end

    -- Test remote
    local function testRemote()
        debugPrint("Testing remote pattern...")
        fireRemote("TestConnection")
    end

    return {
        levelUpPet = addXPToPet,
        levelUpAllPets = levelUpAllPets,
        getPetIds = getPetIds,
        testRemote = testRemote,
        remote = remote
    }
end

return initPetSystem()

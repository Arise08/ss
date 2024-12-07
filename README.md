-- Fixed Remote Execution System
local Players = game:GetService("Players")
local LocalPlayer = Players.LocalPlayer

-- Debug print
local function debugPrint(...)
    print(string.format("[Debug] %s", table.concat({...}, " ")))
end

-- Improved remote finder
local function findRemote()
    for _, v in pairs(getgc(true)) do
        if type(v) == "table" then
            for key, value in pairs(v) do
                if type(value) == "function" and islclosure(value) then
                    local constants = debug.getconstants(value)
                    for _, constant in pairs(constants) do
                        if tostring(constant) == "FireServer" then
                            debugPrint("Found remote function")
                            -- Get the actual remote instance
                            for _, upvalue in pairs(debug.getupvalues(value)) do
                                if typeof(upvalue) == "Instance" and upvalue:IsA("RemoteEvent") then
                                    debugPrint("Found remote:", upvalue:GetFullName())
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

    -- Direct remote call
    local function fireRemote(...)
        local args = {...}
        debugPrint("Firing remote with args:", unpack(args))
        return remote:FireServer(...)
    end

    -- Get pet IDs - using both workspace and potential networked data
    local function getPetIds()
        local pets = {}
        
        -- Try to get from workspace first
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

    -- Add XP to pet
    local function addXPToPet(petId, xpAmount)
        debugPrint("Attempting to add XP to pet:", petId)

        -- First try to register the pet
        fireRemote("AddPetToAutoDelete", petId)
        task.wait(0.1)

        -- Try different XP adding patterns
        -- Pattern 1: Direct XP add
        fireRemote("AddXP", petId, xpAmount)
        task.wait(0.1)

        -- Pattern 2: With player reference
        fireRemote("AddXP", LocalPlayer, xpAmount)
        task.wait(0.1)

        -- Pattern 3: As table
        fireRemote("AddXP", {
            petId = petId,
            amount = xpAmount
        })
    end

    -- Level up all pets
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

    -- Test function to try different remote patterns
    local function testRemote()
        debugPrint("Testing remote patterns...")
        
        -- Test basic remote functionality
        fireRemote("TestConnection")
        task.wait(0.1)
        
        -- Get a pet to test with
        local pets = getPetIds()
        if #pets > 0 then
            local testPet = pets[1]
            debugPrint("Testing with pet:", testPet.id)
            
            -- Try different argument patterns
            fireRemote("AddPetToAutoDelete", testPet.id)
            task.wait(0.1)
            fireRemote("AddXP", testPet.id, 100)
            task.wait(0.1)
            fireRemote("AddXP", LocalPlayer, 100)
        end
    end

    return {
        levelUpPet = addXPToPet,
        levelUpAllPets = levelUpAllPets,
        getPetIds = getPetIds,
        testRemote = testRemote,
        remote = remote
    }
end

-- Create and return the system
local petSystem = initPetSystem()
return petSystem

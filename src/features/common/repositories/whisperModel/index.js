const { createGenericRepository } = require('../genericRepository');

class WhisperModelRepository {
    constructor() {
        this.repo = createGenericRepository('whisper_models');
    }

    // Delegate genericRepository methods
    async getAll() {
        return this.repo.getAll();
    }

    async create(data) {
        return this.repo.create(data);
    }

    async findAll(where) {
        return this.repo.findAll(where);
    }

    async findOne(where) {
        return this.repo.findOne(where);
    }

    async update(where, data) {
        return this.repo.update(where, data);
    }

    async initializeModels(availableModels) {
        const existingModels = await this.getAll();
        const existingIds = new Set(existingModels.map(m => m.id));
        
        for (const [modelId, modelInfo] of Object.entries(availableModels)) {
            if (!existingIds.has(modelId)) {
                await this.create({
                    id: modelId,
                    name: modelInfo.name,
                    size: modelInfo.size,
                    installed: 0,
                    installing: 0
                });
            }
        }
    }

    async getInstalledModels() {
        return this.findAll({ installed: 1 });
    }

    async setInstalled(modelId, installed = true) {
        return this.update({ id: modelId }, { 
            installed: installed ? 1 : 0,
            installing: 0
        });
    }

    async setInstalling(modelId, installing = true) {
        return this.update({ id: modelId }, { 
            installing: installing ? 1 : 0 
        });
    }

    async isInstalled(modelId) {
        const model = await this.findOne({ id: modelId });
        return model && model.installed === 1;
    }

    async isInstalling(modelId) {
        const model = await this.findOne({ id: modelId });
        return model && model.installing === 1;
    }
}

module.exports = WhisperModelRepository;
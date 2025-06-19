// src/lib/models/model-loader.ts
export class ModelLoader {
  static async loadModel(modelName: string) {
    try {
      const response = await fetch(`/models/${modelName}`)
      if (!response.ok) {
        throw new Error(`Failed to load model: ${modelName}`)
      }
      return await response.blob()
    } catch (error) {
      console.error('Model loading error:', error)
      throw error
    }
  }
  
  static getModelPath(modelType: 'dropout' | 'anomaly' | 'combiner') {
    const modelPaths = {
      dropout: '/models/dropout_model.pkl',
      anomaly: '/models/anomaly_model.pkl', 
      combiner: '/models/ds_combiner.pkl'
    }
    return modelPaths[modelType]
  }
}

export class AsyncQueue<T> {
  private queue: (() => Promise<T>)[] = []
  private running = 0
  private maxConcurrent: number

  constructor(maxConcurrent: number = 3) {
    this.maxConcurrent = maxConcurrent
  }

  async add(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn()
          resolve(result)
          return result
        } catch (error) {
          reject(error)
          throw error
        }
      })
      this.process()
    })
  }

  private async process() {
    if (this.running >= this.maxConcurrent || this.queue.length === 0) {
      return
    }

    this.running++
    const fn = this.queue.shift()!

    try {
      await fn()
    } catch (error) {
      console.error('Queue processing error:', error)
    } finally {
      this.running--
      this.process()
    }
  }

  async waitForAll(): Promise<void> {
    while (this.running > 0 || this.queue.length > 0) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }
}

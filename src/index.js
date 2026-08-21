import dotenv from 'dotenv'
import connectDB from './db/index.js'
import { app } from './app.js'
import { createServer } from 'http'
import { Server } from 'socket.io'

dotenv.config({ path: './.env' })

const httpServer = createServer(app)
const io = new Server(httpServer)

app.set("io", io)

const startServer = async () => {
    try {
        await connectDB()

        const preferredPort = Number(process.env.PORT) || 8000
        const fallbackPorts = [preferredPort, 5000, 3000, 8080]
        let portIndex = 0

        const listenOnPort = () => {
            const port = fallbackPorts[portIndex]

            httpServer.once('error', (error) => {
                if (error.code === 'EADDRINUSE' && portIndex < fallbackPorts.length - 1) {
                    portIndex += 1
                    console.warn(`Port ${port} is busy. Trying ${fallbackPorts[portIndex]} instead...`)
                    listenOnPort()
                    return
                }

                console.error('Failed to start the server:', error)
                process.exit(1)
            })

            httpServer.listen(port, () => {
                console.log(`The server is up and running at port ${port}`)
            })
        }

        listenOnPort()
    } catch (error) {
        console.error('Failed to start the server:', error)
        process.exit(1)
    }
}

startServer()

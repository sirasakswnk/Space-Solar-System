// Send a trusted wheel at the actual panel coordinates in the owned test browser.
const socket = new WebSocket(process.argv[2])
let id = 0
const pending = new Map()
const timer = setTimeout(() => { console.error('CDP timeout'); process.exit(1) }, 10000)
socket.addEventListener('message', ({ data }) => {
  const message = JSON.parse(data)
  const request = pending.get(message.id)
  if (request) {
    pending.delete(message.id)
    if (message.error) request.reject(new Error(message.error.message))
    else request.resolve(message.result)
  }
})
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true })
  socket.addEventListener('error', reject, { once: true })
})
const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
  const requestId = ++id
  pending.set(requestId, { resolve, reject })
  socket.send(JSON.stringify({ id: requestId, method, params, sessionId }))
})
try {
  const { targetInfos } = await send('Target.getTargets')
  const target = targetInfos.find(t => t.type === 'page' && t.url === 'http://127.0.0.1:5173/')
  if (!target) throw new Error('Owned BEYOND test tab missing')
  const { sessionId } = await send('Target.attachToTarget', { targetId: target.targetId, flatten: true })
  await send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: 1080, y: 630, deltaX: 0, deltaY: 400 }, sessionId)
  console.log('Trusted wheel sent to explore panel at 1080,630')
  await send('Target.detachFromTarget', { sessionId })
} finally {
  clearTimeout(timer)
  socket.close()
}

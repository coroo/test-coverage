import * as process from 'process'
import * as cp from 'child_process'
import * as path from 'path'

test('create message', async () => {
  const file_path = "__tests__/pytest-coverage.txt";
  createMessage(file_path);
  await expect(createMessage(file_path)).rejects.toThrow('milliseconds not a number')
})

// test('wait 500 ms', async () => {
//   const start = new Date()
//   await wait(500)
//   const end = new Date()
//   var delta = Math.abs(end.getTime() - start.getTime())
//   expect(delta).toBeGreaterThan(450)
// })

// shows how the runner will run a javascript action with env / stdout protocol
test('test runs', () => {
  process.env['INPUT_MILLISECONDS'] = '500'
  const ip = path.join(__dirname, '..', 'lib', 'main.js')
  const options: cp.ExecSyncOptions = {
    env: process.env
  }
  console.log(cp.execSync(`node ${ip}`, options).toString())
})

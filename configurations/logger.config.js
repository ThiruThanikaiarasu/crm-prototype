// const pino = require('pino')
// const path = require('path')

// const LOG_DIR = path.join(process.cwd(), 'logs')

// const baseOptions = {
//   level: process.env.LOG_LEVEL || 'info',
//   timestamp: pino.stdTimeFunctions.isoTime,
//   base: null
// }

// const devTransport = {
//   target: 'pino-pretty',
//   options: {
//     colorize: true,
//     translateTime: true,
//     ignore: 'pid,hostname'
//   }
// }

// const prodTransport = {
//   targets: [
//     {
//       level: 'info',
//       target: 'pino/file',
//       options: {
//         destination: `${LOG_DIR}/app.log`,
//         mkdir: true,
//         sync: false,
//         minLength: 4096
//       }
//     },
//     {
//       level: 'error',
//       target: 'pino/file',
//       options: {
//         destination: `${LOG_DIR}/error.log`,
//         mkdir: true,
//         sync: false,
//         minLength: 4096
//       }
//     }
//   ]
// }

// const loggerConfig =
//   process.env.NODE_ENV === 'production'
//     ? { ...baseOptions, transport: prodTransport }
//     : { ...baseOptions, transport: devTransport }

// module.exports = loggerConfig

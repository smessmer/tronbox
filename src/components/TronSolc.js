const wrapper = require('solc/wrapper')
let {name} = require('../../package')
const path = require('path')
const fs = require('fs-extra')
const homedir = require('homedir')
const {execSync} = require('child_process')

let supportedVersions = [
  '0.4.24',
  '0.4.25',
  '0.5.4',
  '0.5.8',
  '0.5.10',
  '0.5.12',
  '0.5.13',
  '0.5.14',
  '0.5.15',
  '0.6.0',
  '0.6.2'
]

const maxVersion = '0.6.0'

function getWrapper(options = {}) {

  try {
    const params = options.networkInfo.parameters
    for (const p of params) {
      if (p.key === 'getAllowTvmSolidity059') {
        if (p.value && !supportedVersions.includes('0.5.9')) {
          supportedVersions.push('0.5.9')
          break
        }
      }
    }
  } // eslint-disable-next-line no-empty
  catch (e) {
  }
  supportedVersions =
    supportedVersions.map( a => a.split('.').map( n => +n+100000 ).join('.')).sort()
      .map( a => a.split('.').map( n => +n-100000 ).join('.'));

  let compilerVersion = '0.5.4'
  const solcDir = path.join(homedir(), '.tronbox', 'solc')

  if (options.networks) {
    if (options.networks.useZeroFourCompiler) {
      compilerVersion = '0.4.25'
    } else if (options.networks.useZeroFiveCompiler) {
      compilerVersion = '0.5.4'
    }

    try {
      const version = options.networks.compilers.solc.version
      if (supportedVersions.includes(version)) {
        compilerVersion = version
      } else {
        console.error(`Error:
TronBox supports only the following versions:
${supportedVersions.join(' - ')}
`)
        // eslint-disable-next-line no-process-exit
        process.exit()
      }
    } // eslint-disable-next-line no-empty
    catch (e) {
    }
  }

  const soljsonPath = path.join(solcDir, `soljson_v${compilerVersion}.js`)

  if (!fs.existsSync(soljsonPath)) {
    if (process.env.TRONBOX_NAME) {
      name = process.env.TRONBOX_NAME
    }
    const output = execSync(`${name} --download-compiler ${compilerVersion}`).toString()
    if (output.indexOf('Permission required') !== -1) {
      console.error(`
Error: Permissions required.

Most likely, you installed Node as root.
Please, download the compiler manually, running:

tronbox --download-compiler ${compilerVersion}
`)
      // eslint-disable-next-line no-process-exit
      process.exit()
    }
  }
  const soljson = eval('require')(soljsonPath)
  return wrapper(soljson)
}

module.exports.getWrapper = getWrapper
module.exports.supportedVersions = supportedVersions
module.exports.maxVersion = maxVersion

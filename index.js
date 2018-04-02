const fse = require('fs-extra')
const path = require('path')
const sass = require('node-sass')

const config = require('./config')

const globP = promisify(require('glob'))

const srcPath = './src'
const distPath = config.build.outputPath

// clear destination folder
fse.emptyDirSync(distPath)

// copy assets folder
fse.copy(`./static`, `${distPath}`)
console.log('Copied static files\n')
const buildHTML = async () => {
  try {
    const files = await globP('**/*.@(ejs|html)', {cwd: `${srcPath}/pages`})
  } catch (err) {
    console.log('Something happened in the file loop', err)
  }
}

const buildSass = () => {
  sass.render({
    file: path.resolve(__dirname, './styles/main.scss'),
    includePaths: [path.resolve(__dirname, './node_modules')],
    outputStyle: 'compressed'
  }, (err, result) => {
    if (!err) {
      fse.mkdirs(path.resolve(__dirname, './dist/styles/')).then(() => {
      // No errors during the compilation, write this result on the disk
      fse.writeFile(path.resolve(__dirname, './dist/styles/main.css'), result.css, (err) => {
        if (!err) {
          console.log('\nGenerated main.css\n')
        } else {
          console.log('Error compiling Sass', err)
        }
      })
      })
  
    } else {
      console.log('Error compiling Sass', err)
    }
  })
}

buildHTML()
buildSass()

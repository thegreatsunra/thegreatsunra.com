const ejs = require('ejs')
const frontMatter = require('front-matter')
const fse = require('fs-extra')
const path = require('path')
const { promisify } = require('util')
const sass = require('node-sass')

const config = require('./config')

const ejsRenderFile = promisify(ejs.renderFile)
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
    files.forEach(async file => {
      const fileData = path.parse(file)
      let destPath
      if (fileData.name === 'index') {
        destPath = path.join(distPath, fileData.dir)
      } else {
        destPath = path.join(distPath, fileData.dir, fileData.name)
      }
      try {
        // create destination directory
        await fse.mkdirs(destPath)
        const data = await fse.readFile(`${srcPath}/pages/${file}`, 'utf-8')
        // render page
        const pageData = frontMatter(data)
        const templateConfig = Object.assign({}, config, {
          page: pageData.attributes
        })
        let pageContent
        // generate page content according to file type
        if (fileData.ext === '.ejs') {
          pageContent = ejs.render(pageData.body, templateConfig)
        } else {
          pageContent = pageData.body
        }
      } catch (err) {
        console.log('Error making destination paths or reading page data', err)
      }
    })
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

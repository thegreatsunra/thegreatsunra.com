const ejs = require('ejs');
const frontMatter = require('front-matter');
const fse = require('fs-extra');
const path = require('path');
const { promisify } = require('util');
const sass = require('sass');
const globP = require('glob-promise');

const config = require('./config');

const ejsRenderFile = promisify(ejs.renderFile);

const srcPath = './src';
const distPath = config.build.outputPath;

// clear destination folder
fse.emptyDirSync(distPath);

// copy assets folder
fse.copy('./static', `${distPath}`);
console.log('Copied static files\n');
const buildHTML = async () => {
  try {
    const files = await globP('**/*.@(ejs|html)', { cwd: `${srcPath}/pages` });
    files.forEach(async (file) => {
      const fileData = path.parse(file);
      let destPath;
      if (fileData.name === 'index') {
        destPath = path.join(distPath, fileData.dir);
      } else {
        destPath = path.join(distPath, fileData.dir, fileData.name);
      }
      try {
        // create destination directory
        await fse.mkdirs(destPath);
        const data = await fse.readFile(`${srcPath}/pages/${file}`, 'utf-8');
        // render page
        const pageData = frontMatter(data);
        const templateConfig = { ...config, page: pageData.attributes };
        let pageContent;
        // generate page content according to file type
        if (fileData.ext === '.ejs') {
          pageContent = ejs.render(pageData.body, templateConfig);
        } else {
          pageContent = pageData.body;
        }
        try {
          // render layout with page contents
          const layout = pageData.attributes.layout || 'default';
          const str = await ejsRenderFile(
            `${srcPath}/layouts/${layout}.ejs`,
            { ...templateConfig, body: pageContent },
          );
          // save the html file
          if (fileData.name !== 'index') {
            // fse.mkdirs(`${destPath}/${fileData.name}`)
            fse.writeFile(`${destPath}/index.html`, str);
            console.log(`Generated ${destPath}/index.html`);
          } else {
            fse.writeFile(`${destPath}/${fileData.name}.html`, str);
            console.log(`Generated ${destPath}/${fileData.name}.html`);
          }
        } catch (err) {
          console.log('Error rendering EJS file', err);
        }
      } catch (err) {
        console.log('Error making destination paths or reading page data', err);
      }
    });
  } catch (err) {
    console.log('Something happened in the file loop', err);
  }
};

const buildSass = () => {
  sass.render({
    file: path.resolve(__dirname, './scss/main.scss'),
    includePaths: [path.resolve(__dirname, './node_modules')],
    outputStyle: 'compressed',
  }, (buildSassErr, result) => {
    if (!buildSassErr) {
      fse.mkdirs(path.resolve(__dirname, './dist/styles/')).then(() => {
        // No errors during the compilation, write this result on the disk
        fse.writeFile(path.resolve(__dirname, './dist/styles/main.css'), result.css, (writeFileErr) => {
          if (!writeFileErr) {
            console.log('\nGenerated main.css\n');
          } else {
            console.log('Error compiling Sass', writeFileErr);
          }
        });
      });
    } else {
      console.log('Error compiling Sass', buildSassErr);
    }
  });
};

buildHTML();
buildSass();

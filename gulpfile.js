const gulp = require('gulp');
const pug = require('gulp-pug');
const rename = require('gulp-rename');
const browserSync = require('browser-sync');
const packageJson = require('./package.json');

const ts = require('gulp-typescript');
const tsProject = ts.createProject('tsconfig.json');

gulp.task('semantic', require('./semantic/tasks/build'));

gulp.task('pug', ['pug:ja', 'pug:en']);

function compilePug(lang) {
  const l = lang;
  return function(){
      gulp.src('src/index.pug')
        .pipe(pug({
          locals: {
              package: packageJson
            , taDomain: 'textalive.jp'
            , ja: l === 'ja'
            , songs: require('./songs.json')
          },
          verbose: true,
          pretty: true
        }))
        .pipe(rename({ suffix: l === 'ja' ? '' : '.en' }))
        .pipe(gulp.dest('docs'));
    };
}

gulp.task('pug:ja', compilePug('ja'));
gulp.task('pug:en', compilePug('en'));

gulp.task('ts', function(){
  return gulp.src('src/typescripts/**/*.ts')
    .pipe(tsProject())
    .pipe(gulp.dest('./'));
});

gulp.task('browser-sync', function(){
    browserSync({
      port: 8080,
      server: {
        baseDir: 'docs/'
      }
    });
    gulp.watch('docs/**/*.{html,js}', ['reload']);
    gulp.watch('src/index.pug', ['pug']);
    gulp.watch('src/typescripts/**/*.ts', ['ts']);
  });
  
gulp.task('reload', function(){
    browserSync.reload();
  });

gulp.task('default', ['semantic', 'pug', 'ts']);
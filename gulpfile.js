const gulp = require('gulp');
const pug = require('gulp-pug');
const browserSync = require('browser-sync');
const packageJson = require('./package.json');

const ts = require('gulp-typescript');
const tsProject = ts.createProject('tsconfig.json');

gulp.task('semantic', require('./semantic/tasks/build'));

gulp.task('pug', function(){
  return gulp.src('src/**/*.pug')
    .pipe(pug({
      locals: {
          package: packageJson
        , taDomain: 'textalive.jp'
        , ja: true
        , songs: require('./songs.json')
      },
      verbose: true,
      pretty: true
    }))
    .pipe(gulp.dest('docs/'));
});

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
    gulp.watch('src/**/*.pug', ['pug']);
    gulp.watch('src/typescripts/**/*.ts', ['ts']);
  });
  
gulp.task('reload', function(){
    browserSync.reload();
  });

gulp.task('default', ['semantic', 'pug', 'ts']);
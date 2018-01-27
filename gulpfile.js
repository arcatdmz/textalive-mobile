const gulp = require('gulp');
const pug = require('gulp-pug');
const browserSync = require('browser-sync');
const packageJson = require('./package.json');

gulp.task('semantic', require('./semantic/tasks/build'));

gulp.task('pug', function(){
  return gulp.src('src/**/*.pug')
    .pipe(pug({
      locals: { package: packageJson },
      verbose: true,
      pretty: true
    }))
    .pipe(gulp.dest('docs/'));
});

gulp.task('browser-sync', function(){
    browserSync({
      server: {
        baseDir: 'docs/'
      }
    });
    gulp.watch('docs/**/*.{html,js}', ['reload']);
    gulp.watch('src/**/*.pug', ['pug']);
  });
  
gulp.task('reload', function(){
    browserSync.reload();
  });

gulp.task('default', ['semantic', 'pug']);
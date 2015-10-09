var gulp = require('gulp'),
  rename = require('gulp-rename'),
  uglify = require('gulp-uglify');

gulp.task('scripts', function() {
  gulp.src('./instafilta.js')
    .pipe(rename('instafilta.min.js'))
    .pipe(uglify({ preserveComments: 'some' }))
    .pipe(gulp.dest('./'));
});

gulp.task('default', function() {
  gulp.watch('instafilta.js', ['scripts']);
});

gulp.task('build', ['scripts']);

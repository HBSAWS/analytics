var gulp = require('gulp'),
    pkg = require('./package.json'),
    header = require('gulp-header'),
    dateFormat = require('dateformat'),
    uglify = require('gulp-uglify'),
    strip = require('gulp-strip-comments'),
    runSequence = require('run-sequence');

var opts = {
        pkg: require('./package.json'),
        banner: '/*! <%= pkg.banner %> <%= pkg.version %> - <%= date %> - <%= user %> */\n',
        dt: dateFormat('yyyy-mm-dd h:MM:ss TT Z'),
        username: process.env.USERNAME,
        dist: './dist',
        destDev: ( process.platform === 'darwin' ) ? 
            '/Volumes/__nas-dev_dev_webfarm/htdocs/wwwhbs/shared' : 
            '\\\\nas-dev\\stage_webfarm\\htdocs\\securelib\\static\\libs\\analytics\\1.0'
    }


gulp.task('build', function() {
   return gulp.src(['src/*.js'])
   //.pipe(uglify({output: {beautify: true,indent_level: 0}}))
   .pipe(strip())
   .pipe(header(opts.banner, { pkg: opts.pkg, date: opts.dt, user: opts.username } ))
   .pipe(gulp.dest(opts.dist));
})

gulp.task('copy:dev', function() {
    return gulp.src([opts.dist + '/*.js'])
        .pipe(gulp.dest( opts.destDev ));
})

gulp.task('default',['build']);

gulp.task('watch', function() {

    gulp.watch(['src/*.js'],function(){
        runSequence('build','copy:dev');
    })
   
});

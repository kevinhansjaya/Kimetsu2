function asw (sliderId) {
    var that = this, timer = null,
        sliderElem = $('#wikiaPhotoGallery-slider-body-' + sliderId),
        currentImage = $('#wikiaPhotoGallery-slider-' + sliderId + '-0');
    currentImage.find('.nav').addClass('selected');
    currentImage.find('.description').show();
    currentImage.find('.description-background').show();
    sliderElem.find('.nav').click(function (e) {
        if (sliderElem.find('.wikiaPhotoGallery-slider').queue().length == 0) {
            clearInterval(timer);
            WikiaPhotoGallerySlider.scroll($(this));
        }
    });
    $('.wikiaPhotoGallery-slider-body ul li a').click(function () {
        WikiaPhotoGallerySlider.sliderEnabled = !1;
    });
    $(window).bind('EditPagePreviewClosed', function () {
        that.killSlider(timer);
    });
    sliderElem.show();
    if (sliderElem.find('ul').children().length > 1) {
        timer = setInterval(function () {
            that.slideshow(sliderId);
        }, 7000);
    }
}


var WikiaPhotoGallerySlider = {
    sliderEnabled: !0, init: function (sliderId) {
        var that = this, timer = null, sliderElem = $('#wikiaPhotoGallery-slider-body-' + sliderId),
            currentImage = $('#wikiaPhotoGallery-slider-' + sliderId + '-0');
        currentImage.find('.nav').addClass('selected');
        currentImage.find('.description').show();
        currentImage.find('.description-background').show();
        sliderElem.find('.nav').click(function (e) {
            if (sliderElem.find('.wikiaPhotoGallery-slider').queue().length == 0) {
                clearInterval(timer);
                WikiaPhotoGallerySlider.scroll($(this));
            }
        });
        $('.wikiaPhotoGallery-slider-body ul li a').click(function () {
            WikiaPhotoGallerySlider.sliderEnabled = !1;
        });
        $(window).bind('EditPagePreviewClosed', function () {
            that.killSlider(timer);
        });
        sliderElem.show();
        if (sliderElem.find('ul').children().length > 1) {
            timer = setInterval(function () {
                that.slideshow(sliderId);
            }, 7000);
        }
    }, killSlider: function (timer) {
        clearInterval(timer);
        this.sliderEnabled = !0;
    }, scroll: function (nav) {
        var thumb_index = nav.parent().index(),
            scroll_by = parseInt(nav.parent().find('.wikiaPhotoGallery-slider').css('left')),
            slider_body = nav.closest('.wikiaPhotoGallery-slider-body'), parent_id = slider_body.attr('id'),
            description = slider_body.find('.wikiaPhotoGallery-slider-' + thumb_index).find('.description');
        if (slider_body.find('.wikiaPhotoGallery-slider').queue().length == 0) {
            slider_body.find('.nav').removeClass('selected');
            nav.addClass('selected');
            slider_body.find('.description').clearQueue().hide();
            slider_body.find('.wikiaPhotoGallery-slider').animate({left: '-=' + scroll_by}, function () {
                description.fadeIn();
            });
        }
    }, slideshow: function (sliderId) {
        if (WikiaPhotoGallerySlider.sliderEnabled) {
            var current = $('#wikiaPhotoGallery-slider-body-' + sliderId + ' .selected').parent().prevAll().length;
            var next = ((current == $('#wikiaPhotoGallery-slider-body-' + sliderId + ' .nav').length - 1) || (current > 3)) ? 0 : current + 1;
            WikiaPhotoGallerySlider.scroll($('#wikiaPhotoGallery-slider-' + sliderId + '-' + next).find('.nav'));
        }
    }
};

var WikiaPhotoGalleryView = {
    log: function (msg) {
        $().log(msg, 'WikiaPhotoGallery:view');
    },
    ajax: function (method, params, callback) {
        return $.get(wgScript + '?action=ajax&rs=WikiaPhotoGalleryAjax&method=' + method, params, callback, 'json');
    },
    getArticle: function () {
        return (window.skin === 'oasis') ? $('#WikiaArticle') : $('#bodyContent');
    },
    isViewPage: function () {
        var urlVars = $.getUrlVars();
        return (window.wgAction == 'view' || window.wgAction == 'purge') && (typeof urlVars.oldid == 'undefined') && (window.wgNamespaceNumber != -1);
    },
    loadEditorJS: function (callback) {
        var resources = [$.loadJQueryUI, $.loadJQueryAIM];
        if (typeof WikiaPhotoGallery == 'undefined') {
            resources.push(wgExtensionsPath + '/wikia/WikiaPhotoGallery/js/WikiaPhotoGallery.js');
        }
        return $.getResources(resources, callback);
    },
    init: function () {
        if (this.isViewPage()) {
            this.initGalleries();
        }
        this.lazyLoadGalleryImages();
    },
    forceLogIn: function () {
        return UserLogin.isForceLogIn();
    },
    initGalleries: function () {
        var self = this;
        var galleries = this.getArticle().find('.wikia-gallery').not(
            '.template').not('.inited');
        if (galleries.exists()) {
            this.log('found ' + galleries.length + ' galleries');
        }
        galleries.find('a.image').click(function (ev) {
            var linkClass = this.className;
            var linkType = 'unknown';
            if (linkClass.indexOf('lightbox') !== -1) {
                linkType = 'lightbox';
            } else if (linkClass.indexOf('link-internal') !== -1) {
                linkType = 'link-internal';
            } else if (linkClass.indexOf('link-external') !== -1) {
                linkType = 'link-external';
            }
            Wikia.Tracker.track({
                action: 'click',
                category: 'article',
                label: 'show-gallery-' + linkType,
                trackingMethod: 'analytics',
                value: 0
            }, {});
        });
        if (window.skin === 'oasis') {
            var addButtonSelector = '.wikia-photogallery-add'
            galleries.addClass("inited").children(addButtonSelector).show().click(function (ev) {
                ev.preventDefault();
                var event = jQuery.Event("beforeGalleryShow");
                $("body").trigger(event, [$(ev.target)]);
                if (event.isDefaultPrevented()) {
                    return false;
                }
                if (self.forceLogIn()) {
                    return;
                }
                var gallery = $(this).closest('.wikia-gallery'),
                    hash = gallery.attr('hash'),
                    id = gallery.attr('id');
                self.loadEditorJS(function () {
                    WikiaPhotoGallery.ajax('getGalleryData', {
                        hash: hash,
                        articleId: wgArticleId
                    }, function (data) {
                        if (data && data.info == 'ok') {
                            data.gallery.id = id;
                            $().log('data');
                            $().log(data.gallery);
                            WikiaPhotoGallery.showEditor({
                                from: 'view',
                                gallery: data.gallery,
                                target: $(ev.target).closest('.wikia-gallery')
                            });
                        } else {
                            WikiaPhotoGallery.showAlert(data.errorCaption, data.error);
                        }
                    });
                });
            }).hover(function (ev) {
                if (window.skin === 'oasis') {
                    return;
                }
                var gallery = $(this).closest('.wikia-gallery');
                gallery.css({
                    'border-style': 'solid',
                    'border-width': '1px',
                    'padding': 0
                }).addClass('accent');
            }, function (ev) {
                if (window.skin === 'oasis') {
                    return;
                }
                var gallery = $(this).closest('.wikia-gallery');
                gallery.css({
                    'border': '',
                    'padding': '1px'
                }).removeClass('accent');
            });
        } else {
            galleries.addClass("inited");
        }
    },
    lazyLoadCache: {},
    loadAndResizeImage: function (image, thumbWidth, thumbHeight, callback, crop) {
        var self = this;
        var onload = function (img) {
            img.onload = null;
            var imageWidth = img.width;
            var imageHeight = img.height;
            if (crop) {
                var widthResize = imageWidth / thumbWidth;
                var heightResize = imageHeight / thumbHeight;
                var resizeRatio = Math.min(widthResize, heightResize);
                imageHeight = Math.min(imageHeight, parseInt(imageHeight / resizeRatio));
                imageWidth = Math.min(imageWidth, parseInt(imageWidth / resizeRatio));
            } else {
                if (imageWidth > thumbWidth) {
                    imageHeight /= (imageWidth / thumbWidth);
                    imageWidth = thumbWidth;
                }
                if (imageHeight > thumbHeight) {
                    imageWidth /= (imageHeight / thumbHeight);
                    imageHeight = thumbHeight;
                }
            }
            imageHeight = parseInt(imageHeight);
            imageWidth = parseInt(imageWidth);
            image.css({
                height: imageHeight,
                width: imageWidth
            });
            if (!image.hasClass('lzyPlcHld')) {
                image.attr('src', image.attr('data-src')).removeAttr('data-src');
            }
            self.log('loaded: ' + image.attr('src') + ' (' + imageWidth + 'x' + imageHeight + ')' + (crop ? ' + crop' : ''));
            if (typeof callback == 'function') {
                callback(image);
            }
        };
        var key = image.attr('data-src'), img;
        if (typeof self.lazyLoadCache[key] != 'undefined') {
            img = {
                'width': self.lazyLoadCache[key].width,
                'height': self.lazyLoadCache[key].height
            };
            self.log('loaded: using cache');
            onload(img);
        } else {
            img = new Image();
            img.onload = function () {
                self.lazyLoadCache[key] = {
                    'width': img.width,
                    'height': img.height
                };
                onload(img);
            };
            img.src = image.attr('data-src');
        }
    },
    lazyLoadGalleryImages: function () {
        var self = this;
        this.log('lazy loading images...');
        $('.gallery-image-wrapper').find('img[data-src]:not(.lzyPlcHld)').filter(function () {
            var elem = $(this);
            return elem.attr('src') != elem.attr('data-src');
        }).each(function () {
            var image = $(this);
            var thumb = image.closest('.gallery-image-wrapper');
            var thumbWidth = thumb.innerWidth();
            var thumbHeight = thumb.innerHeight();
            var crop = !!image.closest('.wikia-gallery').attr('data-crop');
            self.loadAndResizeImage(image,
                thumbWidth, thumbHeight, function (image) {
                    var imageHeight = image.height();
                    var imageWidth = image.width();
                    var wrapperHeight;
                    var wrapperWidth;
                    if (crop) {
                        wrapperHeight = Math.min(image.height(), thumbHeight);
                        wrapperWidth = Math.min(image.width(), thumbWidth);
                    } else {
                        wrapperHeight = imageHeight;
                        wrapperWidth = imageWidth;
                    }
                    var wrapperOffsetLeft = ((thumbWidth - wrapperWidth) >> 1);
                    var wrapperOffsetTop = ((thumbHeight - wrapperHeight) >> 1);
                    thumb.css({
                        height: wrapperHeight,
                        left: wrapperOffsetLeft,
                        margin: 0,
                        position: 'relative',
                        top: wrapperOffsetTop,
                        width: wrapperWidth,
                        visibility: 'visible'
                    });
                    image.css({
                        'margin-left': Math.min(0, (thumbWidth - parseInt(imageWidth)) >> 1),
                        'margin-top': Math.min(0, (thumbHeight - parseInt(imageHeight)) >> 1)
                    });
                }, crop);
        });
    }
};

var slides = document.querySelectorAll('.wikiaPhotoGallery-slider-body .description');
var slides2 = document.querySelectorAll('.wikiaPhotoGallery-slider-body .nav');
var slides3 = document.querySelectorAll('#slides .slide');
var currentSlide = 0;
var currentSlide2 = 0;
var currentSlide3 = 0;
var currentSlide01 = 0;
var currentSlide02 = 0;
var currentSlide03 = 0;




var slideInterval = setInterval(nextSlide, 4000);

function nextSlide() {



    slides3[currentSlide3].className = 'slide';
    slides3[currentSlide3].className = 'slide';
    slides[currentSlide].className = 'description';
    slides[currentSlide].className = 'description';
    slides[currentSlide].style.display = 'none';
    slides2[currentSlide2].className = 'nav';
    slides2[currentSlide2].className = 'nav';
    //  var sliderElem = $('#wikiaPhotoGallery-slider-body-' + currentSlide2);
    currentSlide3 = (currentSlide3 + 1) % slides3.length;
    currentSlide = (currentSlide + 1) % slides.length;
    currentSlide2 = (currentSlide2 + 1) % slides2.length;
    slides3[currentSlide3].className = 'slide showing';
    slides[currentSlide].className = 'description showing';
    slides[currentSlide].style.display = 'block';
    slides2[currentSlide2].className = 'nav selected';

};
function currentSlideX(latitidto) {

    if (latitidto != 0) {
      clearInterval(slideInterval);
    }else


    console.log(latitidto);
    currentSlide = latitidto;
    currentSlide2 = latitidto;
    currentSlide3 = latitidto;
    slides3[currentSlide3].className = 'slide';
    slides3[currentSlide3].className = 'slide';
    slides[currentSlide].className = 'description';
    slides[currentSlide].className = 'description';
    slides[currentSlide].style.display = 'none';
    slides2[currentSlide2].className = 'nav';
    slides2[currentSlide2].className = 'nav';


    currentSlide03 = (currentSlide3 - 1) % slides3.length;
    currentSlide01 = (currentSlide - 1) % slides.length;
    currentSlide02 = (currentSlide2 - 1) % slides2.length;

    slides3[currentSlide03].className = 'slide ';
    slides[currentSlide01].className = 'description ';
    slides[currentSlide01].style.display = 'none';
    slides2[currentSlide02].className = 'nav ';



    currentSlide3 = (currentSlide3 + 0) % slides3.length;
    currentSlide = (currentSlide + 0) % slides.length;
    currentSlide2 = (currentSlide2 + 0) % slides2.length;

    slides3[currentSlide3].className = 'slide showing';
    slides[currentSlide].className = 'description showing';
    slides[currentSlide].style.display = 'block';
    slides2[currentSlide2].className = 'nav selected';


}
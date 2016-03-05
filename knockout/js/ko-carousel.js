ko.stringTemplateEngine.instance.addTemplate('ko-carousel', document.getElementById('tpl-carousel-main').innerHTML);

Array.prototype.selectRange = function (minIndex, length) {
    var selected = this.filter(function (obj, i) {
        return i >= minIndex && i < minIndex + length;
    });
    return selected;
}

ko.bindingHandlers.carousel = {
	// unique id maintained to maintain unique element ids on creation global usage
    carouselUniqueId: 1,	
    getCarouselUniqueId: function () {
        var value = 'templated-carousel-' + ko.bindingHandlers.carousel.carouselUniqueId;
        ko.bindingHandlers.carousel.carouselUniqueId = ko.bindingHandlers.carousel.carouselUniqueId + 1;
        return value;
    },
	// default items needed to build carousel
    defaults: {
        carouselId: '',
        carouselTarget: ''
    },

	// initialize the carousel with the given element model
    init: function (element, valueAccessor) {
        var $element = $(element),
		value = valueAccessor(),
		unwrappedValue = ko.unwrap(value),
		defs = ko.bindingHandlers.carousel.defaults,
		model = unwrappedValue,
		props = $.extend({}, defs, unwrappedValue.props);
        model.props.carouselId = ko.bindingHandlers.carousel.getCarouselUniqueId();
        model.props.carouselTarget = '#' + model.props.carouselId;

        model.props.cssClass = ko.computed(function () {
            var classVal = 'carousel';
            if (model.props.showSlideTransition()) {
                classVal += ' slide';
            }
            return classVal;
        });

        ko.applyBindingsToNode(element, {
            attr: {
                'data-interval': model.props.autoScrollInterval,
                id: model.props.carouselId,
                'data-wrap': model.props.wrapItemSlides
            },
            css: model.props.cssClass,
            style: {
                'min-height': model.props.carouselMinHeight,
                'max-height': model.props.carouselMaxHeight,
                width: model.props.carouselWidth
            }
        }, model);

        ko.renderTemplate(model.props.template, model, {
            templateEngine: ko.stringTemplateEngine.instance
        }, element);

        ko.computed(function () {
            $element.carousel("pause").removeData();
            $element.carousel({
                wrap: model.props.wrapItemSlides(),
                interval: model.props.autoScrollEnable() ? model.props.autoScrollInterval() : false
            });
        });

        $element.on('slide.bs.carousel', model.events.onSlide);
        $element.on('slid.bs.carousel', model.events.onSlid);
        $($element.find('.carousel-inner .item')[0]).addClass('active');
        $($element.find('.carousel-indicators li')[0]).addClass('active');
        $element.carousel();

		model.Slides.reAlign.subscribe(function (value) {
			if(value) {		
				if(model.props.activeSlideIndex() >= model.Slides().length ) {
					model.props.activeSlideIndex(model.Slides().length - 1);
				}	
				$($element.find('.carousel-inner .item')[model.props.activeSlideIndex()]).addClass('active');
				$($element.find('.carousel-indicators li')[model.props.activeSlideIndex()]).addClass('active');
			}
        });

        return {
            controlsDescendantBindings: true
        };
    }
};

// carousel model object
koModal.carousel = function (modal) {
    var self = this;
	// unique item id used to maintain the unique identifier for all the items being added
    var carouselUniqueItemIndex = 0;
	
	// for identifying carousel indicator clicks
    var indicatorClicked = ko.observable(false);
    var indicatorClickedSlideIndex = ko.observable(-1);

    // local storage for all carousel items
    // shouldn't expose this to outside just because the values should be maintained by carousel modal irrespective of what user gives
    var items = ko.observableArray();
    self.Items = ko.computed(function () {
        return items();
    });
	
	// store the activeSlide Index locally just have a read accessor or validate value on update using an get computed variable
    var activeSlideIndexor = ko.observable(0);

	// slides are the items of bs carousel
	// each slide contains many user given items based on N Items per row and M rows per slide
    self.Slides = ko.observableArray();
	
	// we use this to make reconstruction of slides active
	self.Slides.reAlign = ko.observable(false);

    //just in-case if there are no props to avoid errors
    modal.props = modal.props || {};
	// carousel properties
    self.props = {
		// carousel template id user can register new template and use the id here
        template: 'ko-carousel',
        clickedNextOnLastSlide: ko.observable(false),
		// set this prop to make left/right slider visible 
        sliderControlsVisible: ko.observable(typeof (modal.props.sliderControlsVisible) == 'undefined' ? true : modal.props.sliderControlsVisibl),
		// set this prop to make bubble/ jump slider indicators visible
        showIndicatorControls: ko.observable(typeof (modal.props.showIndicatorControls) == 'undefined' ? true : modal.props.showIndicatorControls),
		// set this prop to make bubble/ jump indicator style to number style
        showIndicatorsAsNumbers: ko.observable(modal.props.showIndicatorsAsNumbers || false),
		// set this to enable auto scroll 
        autoScrollEnable: ko.observable(modal.props.autoScrollEnable || false),
		// set the scroll interval
        autoScrollInterval: ko.observable(modal.props.autoScrollInterval || 500),
        // set this property to have sliding effect on slide changes
		showSlideTransition: ko.observable(typeof (modal.props.showSlideTransition) == 'undefined' ? true : modal.props.showSlideTransition),
		// set this property to slide 0 upon prev click move to last slide/ 0 slide upon next click on last slide
        wrapItemSlides: ko.observable(modal.props.wrapItemSlides || false),
		// send the default item (user items array element template)
        defaultItemTemplateId: ko.observable(modal.props.defaultItemTemplateId || 'tpl-carousel-item-def'),
		// set this property to move left/ right slider controls outside the carousel
		placeControlsOutside: ko.observable(true),
		// no of items per row -- no of columns
        noOfItemsPerRow: ko.observable(modal.props.noOfItemsPerRow || 1),
		// no of rows per slide -- no of rows
        noOfRowsPerSlide: ko.observable(modal.props.noOfRowsPerSlide || 1),
		// left/right carousel control width
		carouselControlWidth: ko.observable('50px'),
		// carousel min height
        carouselMinHeight: '150px',
		// carousel max height
        carouselMaxHeight: '',
		// carousel width
        carouselWidth: '100%',
		// carousel css class
        cssClass: 'carousel'
    };
	// active slide index
    self.props.activeSlideIndex = ko.computed({
        read: activeSlideIndexor,
        write: function (newValue) {
            var current = activeSlideIndexor();
            if (newValue >= 0 && newValue < self.Slides().length && current !== newValue) {
                activeSlideIndexor(newValue);
            }
        }
    }).extend({
        notify: 'always'
    });

	// calculate no of items in each slide
    self.props.noOfItemsPerSlide = ko.computed(function () {
        return self.props.noOfItemsPerRow() * self.props.noOfRowsPerSlide();
    });

	// to push carousel controls outside the caoursel
	self.props.carouselInnerPadding = ko.computed(function() {
		var padStringVal = "0";
		if(self.props.placeControlsOutside()) {
			return '0 '+ self.props.carouselControlWidth().toString();
		}
		return padStringVal;
	});
    
	// constructor for carousel user given item
	// add some properties along with the user object
	var carouselItemConstructor = function (item, index) {
        item.props = item.props || {};
        item.props.Id = ++carouselUniqueItemIndex;
        item.props.index = index;
        item.props.templateId = ko.observable(item.props.templateId || self.props.defaultItemTemplateId());
        item.props.cssClass = ko.computed(function () {
            var className = "col-xs-12 col-sm-12 col-md-12 col-lg-12";
            switch (self.props.noOfItemsPerRow()) {
                case 1: className = "col-xs-12 col-sm-12 col-md-12 col-lg-12"; break;
                case 2: className = "col-xs-6 col-sm-6 col-md-6 col-lg-6"; break;
                case 3: className = "col-xs-4 col-sm-4 col-md-4 col-lg-4"; break;
                case 5:
                default:
                case 4: className = "col-xs-3 col-sm-3 col-md-3 col-lg-3"; break;
                case 7:
                case 8:
                case 9:
                case 6: className = "col-xs-2 col-sm-2 col-md-2 col-lg-2"; break;
                case 10:
                case 11:
                case 12: className = "col-xs-1 col-sm-1 col-md-1 col-lg-1"; break;
            }
            return 'user-item ' + className;
        });
        item.props.targetCarousel = self.props.carouselId;
        return item;
    };

	// constructor for carousel slides
	// contains n no of user given items
    var carouselSlideConstructor = function (items) {
        var self = this;
        self.props = {
            isActive: ko.observable(false),
            cssClass: ko.observable('item')
        };
        self.Items = ko.observableArray();
        for (var itemIndex = 0; itemIndex < items.length; itemIndex++) {
            self.Items.push(items[itemIndex]);
        }
        self.makeActive = function () {
            self.props.cssClass(self.props.cssClass() + ' active');
            self.props.isActive(true);
        }
    };

	// helper functions
    var helper = {
		// this function will group items into slides
        computeElements : function () {

            self.Items().forEach(function (obj, i) {
                obj.props.index = i;
            });

            var noOfSlides = Math.ceil(self.Items().length / self.props.noOfItemsPerSlide());
            self.Slides.removeAll();
            for (var slideIndexor = 0; slideIndexor < noOfSlides; slideIndexor++) {
                var startItemIndex = slideIndexor * self.props.noOfItemsPerSlide();
                var slide = new carouselSlideConstructor(self.Items().selectRange(startItemIndex, self.props.noOfItemsPerSlide()));
                self.Slides.push(slide);
            }
			self.Slides.reAlign(true);
			self.Slides.reAlign(false);
        },
		
		// make other slides not visible
		onActiveSlideChange: function(value) {
			self.Slides().forEach(function(obj, index){
				obj.props.isActive(index == value);
			});
		}
    };
	
	self.props.activeSlideIndex.subscribe(helper.onActiveSlideChange);

	// events 
    self.events = {
		// click on carousel bubbles/ indicators
        onIndicatorControlClick: function (obj, event) {
            var element = $(event.currentTarget);
            var slideIndex = element.data('slide-to');
            indicatorClicked(true);
            indicatorClickedSlideIndex(parseInt(slideIndex, 10))
            return true;
        },

		// on slide of carousel
        onSlide: function (event) {
            //console.log(event);
            var pSlideIndex = self.props.activeSlideIndex();

            if (!indicatorClicked() && !self.props.wrapItemSlides()) {
                if (event.direction == 'left') {
                    if (pSlideIndex == self.Slides().length - 1) {
                        self.props.clickedNextOnLastSlide(true);
                        event.preventDefault();
                        self.props.clickedNextOnLastSlide(false);
                        return false;
                    }
                }
                else {
                    if (pSlideIndex == 0) {
                        event.preventDefault();
                        return false;
                    }
                }
            }
            //console.log('before slide activeIndex: ' + self.props.activeSlideIndex() + ', direction: ' + event.direction);
            return true;
        },
		
		// after slide of carousel
        onSlid: function (event) {
            if (!indicatorClicked()) {
                if (event.direction == 'left') {
                    self.props.activeSlideIndex(self.props.activeSlideIndex() + 1);
                    if (self.props.activeSlideIndex() >= self.Slides().length) {
                        self.props.activeSlideIndex(0);
                    }
                }
                else {
                    self.props.activeSlideIndex(self.props.activeSlideIndex() - 1);
                    if (self.props.activeSlideIndex() < 0) {
                        self.props.activeSlideIndex(self.Slides().length - 1);
                    }
                }
            }
            else {
                self.props.activeSlideIndex(indicatorClickedSlideIndex());
                indicatorClicked(false);
                indicatorClickedSlideIndex(-1);
            }
            //console.log('after slide activeIndex: ' + self.props.activeSlideIndex() + ', direction: ' + event.direction);
        }
    };

	// use this method only to add items to carousel
	// this method transforms user object to carousel useful object
    self.addItems = function (arrayOfObjects) {
        arrayOfObjects.forEach(function (obj, index) {
            items.push(carouselItemConstructor(obj));
        });
        helper.computeElements();
    };

	// remove item an an index
    self.removeItemAtIndex = function (index) {
        if (items().length > index) {
            var newActiveIndex = self.props.activeSlideIndex();
            if (self.props.activeSlideIndex() == index) {
				
            }
            self.props.activeSlideIndex(newActiveIndex);
            items.splice(index, 1);
        }
        helper.computeElements();
    };

	// remove item based on property value
    self.removeItemByProp = function (key, value) {
        var index = -1;
        if (items().some(function (obj, iterator) {
	        index = iterator;
	        var data = ko.unwrap(obj);
	        return data[key] === value;
        }) && index >= 0 && index < items().length) {
            self.removeItemByIndex(index, 1);
        }
        helper.computeElements();
    };

    self.addItems(modal.items);

    //var autoComputation = ko.computed(computeElements);
};

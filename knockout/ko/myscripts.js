
var dgim = function (id) {
    return document.getElementById(id);
}

var dgtn = function (id) {
    return document.getElementsByTagName(id);
}

koModal.msCarousalItem = function (modal) {
    var self = this;
    self.message = ko.observable(modal.message || '');
    self.header = ko.observable(modal.header || '');
    self.subHeader = ko.observable(modal.subHeader || '');
};

var allModals = {};
$(document).ready(function () {
    allModals.progressmodal = new koModal.progress({
        animate: true,
        striped: true,
        value: 35,
        text: 'uploading..'
    });

    var items = [];
    for (var index = 1; index <= 18; index++) {
        items.push(new koModal.msCarousalItem({
            message: 'item ' + index
        }));
    }
	var applyEventHandlers = function(){
		$('.onhover-delete').mouseover(function(event)
		{
		   $(this).find('.glyphicon-trash').show();
		});

		$('.onhover-delete').mouseout(function(event)
		{
		   $(this).find('.glyphicon-trash').hide();
		});
	};
    var getNewElements = function (sIndex, length) {
        var items = [];
        for (var index = sIndex; index <= sIndex + length; index++) {
            items.push(new koModal.msCarousalItem({
                message: 'item ' + index
            }));
        }
        return items;
    }

    allModals.carousalmodal = new koModal.carousel({
        items: items,
        props: {
            defaultItemTemplateId: 'carousel-default-item',
            noOfItemsPerRow: 3,
            noOfRowsPerSlide: 2,
            wrapItemSlides: false,
			showIndicatorsAsNumbers: true
        }
    });
	
	allModals.carousalmodal.allowDelete = true;
	allModals.carousalmodal.deleteCarouselItem = function(obj, event){
		var element = $(event.currentTarget),
		indexToRemove = element.data('iter');		
		allModals.carousalmodal.removeItemAtIndex(indexToRemove);
		applyEventHandlers();
	};
	
    ko.applyBindings(allModals, dgim('ko-example'));
	applyEventHandlers();
});
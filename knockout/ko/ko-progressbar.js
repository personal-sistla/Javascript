ko.stringTemplateEngine.instance.addTemplate('ko-progress-bar', "<div class=\"progress-bar\" role=\"progressbar\" data-bind=\"style: { width: barWidth, 'background-color': color }, attr: { 'aria-valuemin': minValue,  'aria-valuemax' : maxValue, 'aria-valuenow': value }, css: innerCss\"> <span data-bind=\"css: { 'sr-only': textHidden }, style: { color: textcolor }\" > <span data-bind=\"text: status\"></span></span> </div> </div>");

ko.bindingHandlers.progress = {
    defaults: {
        css: 'progress',
        text: 'uploading...',
        textHidden: false,
        striped: true,
        type: '',
        animated: true,
        minValue: 0,
        maxValue: 100
    },

    init: function (element, valueAccessor) {
        var $element = $(element),
		value = valueAccessor(),
		unwrappedValue = ko.unwrap(value),
		defs = ko.bindingHandlers.progress.defaults,
		model = $.extend({}, defs, unwrappedValue);

        ko.renderTemplate(model.template(), model, {
            templateEngine: ko.stringTemplateEngine.instance
        }, element);

        $element.addClass(defs.css);

        return {
            controlsDescendantBindings: true
        };
    }
};

var koModal = koModal || {};

koModal.progress = function (modal) {
    var self = this;
    var currentValue = ko.observable(modal.value || 0);
    var currentMinValue = ko.observable(modal.minValue || 0);
    var currentMaxValue = ko.observable(modal.maxVaue || 100);

    self.animated = ko.observable(modal.animate || false);
    self.type = ko.observable(modal.type || '');
    self.color = ko.observable(modal.color || '');
    self.striped = ko.observable(modal.striped || false);
    self.text = ko.observable(modal.text || 'completed');
    self.template = ko.observable(modal.template || 'ko-progress-bar');
    self.textcolor = ko.observable(modal.textcolor || '#ffffff');

    self.value = ko.computed({
        read: currentValue,
        write: function (newValue) {
            var current = currentValue(),
            valueToWrite = (newValue > self.maxValue() || newValue < self.minValue()) ? current : newValue;
            if (valueToWrite !== current) {
                currentValue(valueToWrite);
            } else {
                if (newValue != current) {
                    currentValue.notifySubscribers(valueToWrite);
                }
            }
        }
    }).extend({
        notify: "always"
    });

    self.minValue = ko.computed({
        read: currentMinValue,
        write: function (newValue) {
            var current = currentMinValue(),
            valueToWrite = (newValue > self.maxValue()) ? current : newValue;

            if (valueToWrite !== current) {
                if (valueToWrite > self.value())
                    self.value(valueToWrite);
                currentMinValue(valueToWrite);
            } else {
                if (newValue != current) {
                    currentMinValue.notifySubscribers(valueToWrite);
                }
            }
        }
    }).extend({
        notify: "always"
    });

    self.maxValue = ko.computed({
        read: currentMaxValue,
        write: function (newValue) {
            var current = currentMinValue(),
            valueToWrite = (newValue < self.minValue()) ? current : newValue;

            if (valueToWrite !== current) {
                if (valueToWrite < self.value())
                    self.value(valueToWrite);
                currentMaxValue(valueToWrite);
            } else {
                if (newValue != current) {
                    currentMaxValue.notifySubscribers(valueToWrite);
                }
            }
        }
    }).extend({
        notify: "always"
    });

    self.barWidth = ko.computed(function () {
        var val = Math.floor(100 * (self.value() - self.minValue()) / (self.maxValue() - self.minValue()));
        if (val < 0)
            val = 0;
        else if (val > 100)
            val = 100;
        return val.toString() + '%';
    });

    self.status = ko.computed(function () {
        return self.barWidth() + ' ' + self.text();
    });

    self.innerCss = ko.computed(function () {
        var css = '';
        if (self.animated()) {
            css += 'active progress-bar-reverse ';
        }
        if (self.striped()) {
            css += 'progress-bar-striped ';
        }
        if (self.type()) {
            css += 'progress-bar-' + self.type();
        }
        return css;
    });
};

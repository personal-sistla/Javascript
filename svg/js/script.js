$(document).ready(function () {

    var utils = function () {

        var computedValueType = {
            width: undefined,
            ringWidth: undefined,
            fontSize: undefined,
            duration: undefined,
            interval: undefined,
            fontColor: undefined,
            countDown: undefined,
            errors: [],
            circle: {
                x: undefined,
                y: undefined,
                r: undefined,
                d: undefined,
                bgd: undefined,
                bgColor: undefined,
                color: undefined,
                p: undefined
            }
        };

        var getTimerVariables = function (cd) {
            var defs = [];
            if (cd.countDown) {
                for (var i = cd.duration, t = cd.duration; i >= 0; i--, t -= cd.interval) {
                    defs.push({ key: "a" + i, value: t });
                }
            } else {
                for (var i = 0, t = 0; i <= Math.ceil(cd.duration / cd.interval) ; i++, t += cd.interval) {
                    defs.push({ key: "a" + i, value: t });
                }
            }
            return defs;
        };

        var htmlToSingleLineText = function (inputHtml) {
            if (inputHtml) {
                return inputHtml.replace(/\>\s+\</g, '><');
            }
            return inputHtml;
        };

        var computeValues = function (ds) {
            var result = JSON.parse(JSON.stringify(computedValueType));

            result.errors = [];
            var reg = /^#[0-9a-f]{6}$/i;

            try {
                result.width = parseInt(ds.width.val());
                if (!result.width || result.width <= 0) {
                    throw new Error('invalid width : ' + result.width);
                }
            } catch (e) {
                e.control = ds.width.attr('id');
                result.errors.push(e);
            }
            try {
                result.ringWidth = parseInt(ds.ringWidth.val());
                if (!result.ringWidth || result.ringWidth <= 0) {
                    throw new Error('invalid ring Width : ' + result.ringWidth);
                }
            } catch (e) {
                e.control = ds.ringWidth.attr('id');
                result.errors.push(e);
            }
            try {
                result.fontSize = parseInt(ds.fontSize.val());
                if (!result.fontSize || result.fontSize <= 0) {
                    throw new Error('invalid font size : ' + result.fontSize);
                }
            } catch (e) {
                e.control = ds.fontSize.attr('id');
                result.errors.push(e);
            }
            try {
                result.duration = parseInt(ds.duration.val());
                if (!result.duration || result.duration <= 0) {
                    throw new Error('invalid duration to run : ' + result.duration);
                }
            } catch (e) {
                e.control = ds.duration.attr('id');
                result.errors.push(e);
            }
            try {
                result.interval = parseInt(ds.interval.val());
                if (!result.interval || result.interval <= 0) {
                    throw new Error('invalid interval to run : ' + result.interval);
                }
                if (result.duration % result.interval != 0) {
                    throw new Error('interval should correctly scale to total duration : ' + result.interval);
                }
            } catch (e) {
                e.control = ds.interval.attr('id');
                result.errors.push(e);
            }
            try {
                result.fontColor = ds.fontColor.val();
                if (!reg.test(result.fontColor)) {
                    throw new Error('invalid font Color : ' + result.fontColor);
                }
            } catch (e) {
                e.control = ds.fontColor.attr('id');
                result.errors.push(e);
            }

            var hasBorder = ds.border.is(':checked');

            result.countDown = ds.countDown.is(':checked');

            result.circle = {
                x: result.width / 2,
                y: result.width / 2,
                r: Math.floor((result.width - result.ringWidth) / 2),
                d: result.ringWidth - (hasBorder ? 2 : 0),
                bgd: result.ringWidth
            };

            result.circle.p = result.circle.r * Math.PI * 2;

            try {
                result.circle.color = ds.color.val();
                if (!reg.test(result.circle.color)) {
                    throw new Error('invalid circle Color : ' + result.circle.color);
                }
            } catch (e) {
                e.control = ds.color.attr('id');
                result.errors.push(e);
            }

            try {
                result.circle.bgColor = ds.bgColor.val();
                if (!reg.test(result.circle.bgColor)) {
                    throw new Error('invalid circle background color : ' + result.circle.bgColor);
                }
            } catch (e) {
                e.control = ds.bgColor.attr('id');
                result.errors.push(e);
            }

            return result;
        };

        var copyToClipBoard = function (elem) {

            // create hidden text element, if it doesn't already exist
            var targetId = "_hiddenCopyText_";
            var isInput = elem.tagName === "INPUT" || elem.tagName === "TEXTAREA";
            var origSelectionStart, origSelectionEnd;
            if (isInput) {
                // can just use the original source element for the selection and copy
                target = elem;
                origSelectionStart = elem.selectionStart;
                origSelectionEnd = elem.selectionEnd;
            } else {
                // must use a temporary form element for the selection and copy
                target = document.getElementById(targetId);
                if (!target) {
                    var target = document.createElement("textarea");
                    target.style.position = "absolute";
                    target.style.left = "-9999px";
                    target.style.top = "0";
                    target.id = targetId;
                    document.body.appendChild(target);
                }
                target.textContent = typeof elem === 'string' ? elem : elem.textContent;
            }
            // select the content
            var currentFocus = document.activeElement;
            target.focus();
            target.setSelectionRange(0, target.value.length);

            // copy the selection
            var succeed;
            try {
                succeed = document.execCommand("copy");
            } catch (e) {
                succeed = false;
            }
            // restore original focus
            if (currentFocus && typeof currentFocus.focus === "function") {
                currentFocus.focus();
            }

            if (isInput) {
                // restore prior selection
                elem.setSelectionRange(origSelectionStart, origSelectionEnd);
            } else {
                // clear temporary content
                target.textContent = "";
            }
            return succeed;
        };

        var generateTimerHtmlMarkup = function (cd) {

            var div = document.createElement('div');
            var svgMap = document.createElement('svg');
            svgMap.setAttribute('width', cd.width);
            svgMap.setAttribute('height', cd.width);
            svgMap.setAttribute('xmlns', "http://www.w3.org/2000/svg");
            svgMap.setAttribute('xmlns:xlink', "http://www.w3.org/1999/xlink");
            div.appendChild(svgMap);

            var textDefinitions = getTimerVariables(cd);

            var defs = document.createElement('defs');
            _.each(textDefinitions, function (obj) {
                var txt = document.createElement('text');
                txt.setAttribute('id', obj.key);
                txt.innerHTML = obj.value;
                defs.appendChild(txt);
            });
            svgMap.appendChild(defs);

            var bgCircle = document.createElement('circle');
            bgCircle.setAttribute('r', cd.circle.r);
            bgCircle.setAttribute('cx', cd.circle.x);
            bgCircle.setAttribute('cy', cd.circle.y);
            bgCircle.setAttribute('stroke-width', cd.circle.bgd);
            bgCircle.setAttribute('fill', 'none');
            bgCircle.setAttribute('stroke', cd.circle.bgColor);
            svgMap.appendChild(bgCircle);

            var fgCircle = document.createElement('circle');
            fgCircle.setAttribute('r', cd.circle.r);
            fgCircle.setAttribute('cx', cd.circle.x);
            fgCircle.setAttribute('cy', cd.circle.y);
            fgCircle.setAttribute('stroke-width', cd.circle.d);
            fgCircle.setAttribute('fill', 'none');
            fgCircle.setAttribute('stroke', cd.circle.color);
            fgCircle.setAttribute('stroke-dashoffset', !cd.countDown ? cd.circle.p : 0);
            fgCircle.setAttribute('stroke-dasharray', cd.circle.p);
            fgCircle.setAttribute('transform', 'rotate(-90, ' + cd.circle.x + ', ' + cd.circle.y + ')');

            var fgAnimate = document.createElement('animate');
            fgAnimate.setAttribute('attributeType', 'XML');
            fgAnimate.setAttribute('attributeName', 'stroke-dashoffset');
            fgAnimate.setAttribute('from', cd.countDown ? 0 : cd.circle.p);
            fgAnimate.setAttribute('to', cd.countDown ? cd.circle.p : 0);
            fgAnimate.setAttribute('begin', '0s');
            fgAnimate.setAttribute('dur', cd.duration + 's');

            fgCircle.appendChild(fgAnimate);
            svgMap.appendChild(fgCircle);


            var tsp = document.createElement('use');
            tsp.setAttribute('x', '50%');
            tsp.setAttribute('y', '50%');
            tsp.setAttribute('text-anchor', 'middle');
            tsp.setAttribute('dy', '0.35em');
            tsp.setAttribute('stroke', cd.fontColor || 'black');
            tsp.setAttribute('font-size', cd.fontSize);
            tsp.setAttribute('fill', "freeze");
            tsp.setAttribute('xlink:href', '#' + _.last(textDefinitions).key);

            var anim = document.createElement('animate');
            anim.setAttribute('id', 'timer_animate');
            anim.setAttribute('attributeType', 'XML');
            anim.setAttribute('attributeName', 'xlink:href');
            anim.setAttribute('values', _.map(_.initial(textDefinitions), function (obj) { return '#' + obj.key; }).join("; "));
            anim.setAttribute('dur', (cd.duration) + 's');

            tsp.appendChild(anim);

            svgMap.appendChild(tsp);

            return {
                html: div.innerHTML
            };
        };

        return {
            HtmlConverter: htmlToSingleLineText,
            GetComputations: computeValues,
            CopyToClipBoard: copyToClipBoard,
            GenerateHtmlMarkup: generateTimerHtmlMarkup
        };
    }();

    (function () {
        
        var dataSource = {
            width: $("#input_width"),
            ringWidth: $("#input_ring_width"),
            fontSize: $("#input_font_size"),
            fontColor: $("#input_font_color"),
            duration: $("#input_seconds"),
            interval: $("#input_interval"),
            color: $("#input_color"),
            bgColor: $("#input_bg_color"),
            border: $('#input_has_ring_border'),
            countDown: $('#input_dec_count')
        };
        var dataTarget = {
            containers: {
                errors: $('#errors'),
                preview: $('#preview'),
                markup: $('#markup'),
            },
            holder: {
                errorsList: $('#errors-list'),
                svgContainer: $('#svgContainer'),
                markupContainer: $('#svgMarkupContainer'),
            },
        };

        var enableDisableMarkUpPreview = function (flag) {
            $('#toggleMarkup').prop('disabled', !flag);
        };

        var initOutput = function () {
            _.each(_.keys(dataTarget.containers), function (k) {
                dataTarget.containers[k].hide();
            });
            enableDisableMarkUpPreview(false);
        };

        _.each(_.values(dataSource), function (a) {
            $(a).on('change', function (e, o) {
                initOutput();
            });
        });

        initOutput();


        $("form").on('click', '#previewGenerateMarkup', function (e, o) {
            e.preventDefault();
            initOutput();

            var result = utils.GetComputations(dataSource);

            if (result.errors.length > 0) {
                var i = 0, errorHtml = '<ul class="list-group">';
                for (i = 0; i < result.errors.length; i++) {
                    errorHtml += '<a href="#' + result.errors[i].control + '" class="list-group-item">' + result.errors[i].message + '</a>';
                }
                errorHtml += '</ul>';

                $(dataTarget.holder.errorsList).html(errorHtml);
                $(dataTarget.containers.errors).show();
                return;
            }

            var markup = utils.GenerateHtmlMarkup(result);
            dataTarget.holder.svgContainer.html(markup.html);

            $(dataTarget.holder.markupContainer).text(markup.html);
            $(dataTarget.containers.preview).show();
            enableDisableMarkUpPreview(true);
        });

        $('form').on('click', '#toggleMarkup', function (e, o) {
            e.preventDefault();
            if (!$(dataTarget.containers.markup).hasClass('disabled')) {
                $(dataTarget.containers.markup).toggle();
            }
        });

        $("#markup").on('click', '#copyMarkup', function (e, o) {
            utils.CopyToClipBoard(utils.HtmlConverter(utils.GenerateHtmlMarkup(utils.GetComputations(dataSource)).html));
        });

        $('[title]').tooltip({
            toggle: 'tooltip',
            html: true,
            placement: 'bottom',
            trigger: 'hover'
        });
    }());

});
/*!
 * instaFilta2 - version: 2.0.0
 * jQuery plugin for performing fast customized in-page filtering
 * Documentation: https://github.com/chromawoods/instaFilta
 * Author: Andreas Weber <andreas@chromawoods.com> (http://chromawoods.com)
 */

 ;(function($) {

  /* Yeah this plugin requires jQuery. */
  if (typeof $ !== 'function') {
    console.log('instaFilta needs jQuery to work!');
    return;
  }

  var CONST = {
    checkables: '[type=radio], [type=checkbox]'
  };

  $.fn.instaFilta = function(options) {

    var _$master = this, _$allTriggers = null;

    var _instance = { sections: [], targets: [], initiators: [] };

    /* These are defaults, DO NOT CHANGE! */
    var settings = $.extend({

        /* Outputs log messages in the JS console. */
        enableLogging: false,

        /* Selector to use for trigger elements. */
        triggers: '.instafilta-trigger',

        /* These are the actual target elements. Their text will get passed to the filtering process. */
        targets: '.instafilta-target',

        /* Set a parent element class to apply show/hide logic to it, rather than the actual target.  */
        targetParentClass: null,

        /* Selector to use for sections. */
        sections: '.instafilta-section',

        /* Matching targets will get this class. */
        targetMatchClass: 'instafilta-match',

        /* Non-matching targets will get this class. */
        targetUnMatchClass: 'instafilta-unmatch',

        /* Matching sections will get this class. */
        sectionMatchClass: 'instafilta-match',

        /* Non-matching sections will get this class. */
        sectionUnMatchClass: 'instafilta-unmatch',

        /* If markMatches is true, this class will be used for the span wrapping matching text. */
        matchingTextClass: 'instafilta-matching-text',

        /* Target data attribute used for categorization. */
        categoryDataAttr: 'instafilta-category',

        /* Target data attribute used for category group. */
        categoryGroupDataAttr: 'data-instafilta-category-group',

        /* Whether to use synonyms or not. */
        useSynonyms: true,

        /* Runs the filtering process one initial time just after setting up. */
        filterOnLoad: true,

        /* It can be wise to have a delay when using a text field on a huge list,
        to allow for keystrokes to be collected. */
        triggerDelay: 0,

        /* Set to true to only match terms from the beginning of targets. */
        beginsWith: false,

        /* If using synonyms, these are the definitions of how they should be "translated" when comparing. */
        synonyms: [
          { src: 'à,á,å,ä,â,ã', dst: 'a' },
          { src: 'À,Á,Å,Ä,Â,Ã', dst: 'A' },
          { src: 'è,é,ë,ê', dst: 'e' },
          { src: 'È,É,Ë,Ê', dst: 'E' },
          { src: 'ì,í,ï,î', dst: 'i' },
          { src: 'Ì,Í,Ï,Î', dst: 'I' },
          { src: 'ò,ó,ö,ô,õ', dst: 'o' },
          { src: 'Ò,Ó,Ö,Ô,Õ', dst: 'O' },
          { src: 'ù,ú,ü,û', dst: 'u' },
          { src: 'Ù,Ú,Ü,Û', dst: 'U' },
          { src: 'ç', dst: 'c' },
          { src: 'Ç', dst: 'C' },
          { src: 'æ', dst: 'ae' }
        ],

        /* Decides whether to use jQuery to hide/show (if not, then CSS should be used). */
        jQueryHideShow: true,

        /* Set to true for case sensitive matching. */
        caseSensitive: false,

        /* Wraps a span around the matching part of the target's text. */
        markMatches: false,

        /* A section will become unmatched when there are no matching targets left. */
        hideEmptySections: true,

        /* If true, the result will be combined across all initiators. */
        combineInitiators: true,

        /* Default initiator behavior definitions. */
        initiatorBehaviors: [
          {
            'selector': '[type=text]',
            'events': 'keyup',
            'type': 'term'
          },
          {
            'selector': CONST.checkables,
            'events': 'change',
            'type': 'category',
            'groupBy': 'name',
            'noneMatchesAll': true
          }
        ]

      }, options);



    /* Logs a message to the JS console. */
    var log = function(msg, data, severity) {

      if (settings.enableLogging) {

        severity = severity || 'log';

        if (console && console[severity]) {
          console[severity]('instaFilta: ' + msg, data);
        }

      }

    };



    /* Returns a normalized string based on term settings. */
    var normalizeTerm = function(term) {

      /* Check casing setting. */
      if (settings.caseSensitive === false) {
        term = term.toLowerCase();
      }

      /* Check synonym setting. */
      if (settings.useSynonyms) {
        $.each(settings.synonyms, function(i, synonym) {
          $.each(synonym.src, function(i, srcChar) {
            term = term.replace(srcChar, synonym.dst);
          });
        });
      }

      return term;
    };



    /* Add some data attributes to each searchable item. The "if" prefix is
      just there to prevent conflicts with other scripts */
    var prepareTargets = function($targets) {

      $targets.each(function() {

        var $i = $(this), $parent = [],
          categoryData = $i.data(settings.categoryDataAttr);

        if (settings.targetParentClass) {
          $parent = $i.closest('.' + settings.targetParentClass);
        }

        _instance.targets.push({
            $el: $i,
            $container: ($parent.length) ? $parent : $i,
            isMatching: false,
            matchClass: settings.targetMatchClass,
            unMatchClass: settings.targetUnMatchClass,
            categories: categoryData ? categoryData.split(',') : [],
            rawText: normalizeTerm($i.text()),
            originalHtml: $i.html()
          });

      });

      log('Prepared ' + $targets.length + ' tagret(s)');
    };



    var prepareSections = function($sections) {

      $sections.each(function() {
        _instance.sections.push({
            $el: $(this),
            isMatching: false,
            matchClass: settings.sectionMatchClass,
            unMatchClass: settings.sectionUnMatchClass,
          });
      });

      log('Prepared ' + $sections.length + ' sections');

    };



    var applyTargetVisuals = function(item) {

      var matchedText = null;

      if (item.isMatching) {

        /* Check if a span should be wrapped around matching text. */
        if (item.matchingTerm && settings.markMatches) {
          matchedText = item.$el.text().substring(item.matchStartIndex, item.matchStartIndex + item.matchingTerm.length);
          item.$el.html(item.$el.text().replace(matchedText, '<span class="' + settings.matchingTextClass + '">' + matchedText + '</span>'));
        }

        else if (settings.markMatches) {
          item.$el && item.$el.html(item.originalHtml);
        }

        item.$container.removeClass(item.unMatchClass).addClass(item.matchClass);
        settings.jQueryHideShow && item.$container.show();

      }

      else {
        item.$container.addClass(item.unMatchClass).removeClass(item.matchClass);
        settings.jQueryHideShow && item.$container.hide();
        item.$el && item.$el.html(item.originalHtml);
      }

    };



    var applySectionVisuals = function(section) {

      var showOrHide = null;

      if (section.isMatching) {
        section.$el.removeClass(section.unMatchClass).addClass(section.matchClass);
        showOrHide = 'show';
      }

      else {
        section.$el.removeClass(section.matchClass).addClass(section.unMatchClass);
        showOrHide = 'hide';
      }

      (settings.hideEmptySections && settings.jQueryHideShow) && section.$el[showOrHide]();

    };



    /* Returns boolean depending on match. */
    var isTargetMatch = function(target, initiator) {

      var isTermMatch = function() {

        var term = initiator.term ? normalizeTerm(initiator.term) : '',
          index = target.rawText.indexOf(term);

          if (settings.beginsWith && index !== 0) {
            index = -1;
          }

          if (term === '' || index >= 0) {
            target.matchingTerm = term;
            target.matchStartIndex = index;

            log('Target matches', target);

            return true;
          }

          return false;
      };

      var isCategoryMatch = function() {

        var match = false;

        if (initiator.active && target.categories) {

          $.each(initiator.triggers, function(i, trigger) {

            if (!trigger.active) { return; }

            if (trigger.categories === false) {
              match = true;
            }

            else {

              /* Multiple categories can be triggered from a single trigger. */
              $.each(trigger.categories, function(j, triggerCategory) {

                /* Check against all target categories. */
                $.each(target.categories, function(k, targetCategory) {
                  if (triggerCategory === targetCategory) {
                    match = true;
                  }
                });

              })

            }
          });

        }

        return match;
      };

      /* Category initiator. */
      if (initiator.behavior.type === 'category' && initiator.active) {
        return isCategoryMatch();
      }

      /* Initiator uses a string term. */
      else if (typeof initiator.term === 'string') {
        return isTermMatch();
      }

      /* Initiator is not applicable to this target. */
      else { return true; }

    };



    var resetList = function() {

      $.each(_instance.targets, function(i, item) {
        item.isMatching = true;
        applyTargetVisuals(item);
      });

      $.each(_instance.sections, function(i, item) {
        item.isMatching = true;
        applySectionVisuals(item);
      });

    };



    /* Iterates each section and checks if there are matching targets it. */
    var handleSections = function() {

      var matchingSections = 0;

      if (settings.hideEmptySections) {

        $.each(_instance.sections, function(i, section) {

          if (section.$el.find('.' + settings.targetMatchClass).length > 0) {
            matchingSections++;
            section.isMatching = true;
          }

          else { section.isMatching = false; }

          applySectionVisuals(section);

        });

        log('Matching sections', matchingSections);
      }

    };



    /* This is the start of the main filtering process */
    var startFiltering = function() {

      var initiatorMatch = null,
        matchingInitiators = 0,
        matchingTargets = 0;

      $.each(_instance.targets, function(i, target) {

        matchingInitiators = 0;
        target.isMatching = false;

        $.each(_instance.initiators, function(j, initiator) {

          if (isTargetMatch(target, initiator)) {
            matchingInitiators++;
          }

        });

        if (matchingInitiators === _instance.initiators.length) {
          matchingTargets++;
          target.isMatching = true;
        }

        applyTargetVisuals(target);

      });

      log('Matching targets', matchingTargets);

      /* Handle sections. */
      handleSections();

    };



    /* Registers an initiator, which can trigger the filtering process */
    var addTrigger = function($elem, behavior) {

      if (!$elem.length) { return false; }

      var createGroup = function(initiator) {

        var group = [];

        var addGroupTrigger = function($e) {

          var triggerTimer = null;

          var categories = $e.data(settings.categoryDataAttr) ? $e.data(settings.categoryDataAttr).split(',') : false;

          var trigger = {
            $el: $e.data('if-initiator', true),
            categories: categories,
            active: false
          };

          /* The trigger was triggered! */
          trigger.$el.on(behavior.events, function() {

            var term = null, $triggered = $(this), activeTriggers = 0;

            log('Initiator triggered', behavior);

            clearTimeout(triggerTimer);

            /* Handle text fields. */
            if (behavior.type === 'term') {
              initiator.term = $elem.val();
            }

            /* Handle radio buttons and checkboxes. */
            $.each(initiator.triggers, function(i, t) {
              if (t.$el.is(CONST.checkables) && t.$el.is(':checked')) {
                t.active = true;
                activeTriggers++;
              }
              else {
                t.active = false;
              }
            });

            /* If all are unchecked, then match everything if noneMatchesAll. */
            if (activeTriggers === 0 && initiator.behavior.noneMatchesAll) {
              initiator.active = false;
            }
            else { initiator.active = true; }

            triggerTimer = setTimeout(startFiltering, settings.triggerDelay);
          });

          group.push(trigger);
        };

        switch (behavior.groupBy) {
          case 'name':
            _$allTriggers.filter('[name=' + $elem.attr('name') + ']').each(function() {
              addGroupTrigger($(this));
            });
            break;
          default:
            addGroupTrigger($elem);
        }

        return group;
      };

      var initiator = {
        behavior: behavior,
        active: false
      };

      if (typeof initiator.behavior.triggerDelay !== 'number') {
        initiator.behavior.triggerDelay = settings.triggerDelay;
      }

      initiator.triggers = createGroup(initiator);
      _instance.initiators.push(initiator);

      log('Done adding initiator', initiator);
    };



    /* If there are elements in _$allTargets, this will take place */
    var init = function() {

      _$allTriggers = _$master.find(settings.triggers);

      /* Split synonym src into arrays. */
      if (settings.useSynonyms) {

        $.each(settings.synonyms, function(i, s) {
          s.src = s.src.split(',');
        });

      }

      /* Register all initiators. */
      _$allTriggers.each(function() {

        var $trigger = $(this), behavior = null;

        for (var i = 0; i < settings.initiatorBehaviors.length; i++) {

          behavior = settings.initiatorBehaviors[i];

          if ($trigger.is(behavior.selector) && !$trigger.data('if-initiator')) {
            addTrigger($trigger, behavior);
            break;
          }

        }

      });

      prepareTargets(_$master.find(settings.targets));
      prepareSections(_$master.find(settings.sections));
      settings.filterOnLoad && startFiltering();


      /* Returns methods to be used from the outside. */
      return {
        reset: resetList,
        addTrigger: addTrigger,
        getTargets: function() { return _instance.targets; },
        getInitiators: function() { return _instance.initiators; }
      };


    };



    /* Get the party startin'! */
    if (_$master.length) {
      return init();
    }

    else {
      log('Nothing to setup: No container to work on.');
    }


  };

}(jQuery));

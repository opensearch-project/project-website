define(['jquery'], function($) {
    $('.locale-date').each(function() {
        var date = new Date(this.innerText);
        this.replaceWith(date.toDateString());
    });

    $('.locale-datetime').each(function() {
        var p = this.parentElement;
        var date = new Date(this.innerText);
        var local_tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        var event_tz = this.dataset['tz'];

        $('<h3>In your time zone (' + local_tz + ')</h3>').prependTo(p);

        this.replaceWith(date.toLocaleDateString());
        $('<br />').appendTo(p);
        $('<strong>Time:<strong>').appendTo(p);
        p.append(' ');
        p.append(date.toLocaleTimeString());

        /*
         * On-site events have a time zone. If the user time zone is different
         * than the event one, also display the date and time of the event from
         * the event timme zone.
         */
        if (event_tz && event_tz != local_tz) {
            $('<h3>In the event time zone (' + event_tz + ')</h3>').appendTo(p);
            $('<strong>Date:<strong> ').appendTo(p);
            p.append(' ');
            p.append(date.toLocaleDateString(undefined, {timeZone: event_tz}));
            $('<br />').appendTo(p);
            $('<strong>Time:<strong>').appendTo(p);
            p.append(' ');
            p.append(date.toLocaleTimeString(undefined, {timeZone: event_tz}));
        }
    });
});

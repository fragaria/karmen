Based on https://github.com/leemunroe/responsive-html-email-template

If you need to modify the root template, do your edits in `base.html` and
then run it through [CSS inliner](https://htmlemail.io/inline/) and store that as `base-inlined.html`.

- `%%CONTENT%%` gets replaced with the actual email content.
- `%%YEAR%%` gets replaced with current year.

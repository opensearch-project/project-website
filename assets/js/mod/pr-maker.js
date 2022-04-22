define([
    'jquery' //requires jquery
], function( $ ) {

    var PrMaker = function() {
        this.init();
    };

    PrMaker.prototype = {
        init: function(){
            let template = '';
            let createUrl = function() {
                let random_pr_number = String(Math.random()*1000000).substring(0,6);
                let name = $('#projectName').val();
                let description = $('#projectDescription').val();
                let owner = $('#projectOwner').val();
                let ownerLink = $('#projectOwnerLink').val();
                let link = $('#projectLink').val();
                let license = $('#projectLicense').val();
                let license_link =  $('#projectLicenseLink').val();

                let commitMessage = $('#commitMessage').val();
                let fullName = $('#fullName').val();
                let emailAddress = $('#emailAddress').val();
                let fileName = $('#fileName').val();


                let body_markdown = `---
name: ${name}
description: ${description}
owner: ${owner}
link: ${link}
license: ${license}
license_link: ${license_link}
`;
                if (ownerLink.length > 0) {
                    body_markdown += `owner_link: ${ownerLink}
`;
                }
                body_markdown += '---';
                let message = encodeURIComponent(commitMessage);
                let dco = encodeURIComponent(`Signed-off-by: ${fullName} <${emailAddress}>`);
                let branch = encodeURIComponent('new-community-project-'+random_pr_number);
                let filename = encodeURIComponent(fileName);
                let body = encodeURIComponent(body_markdown);
                template = `https://github.com/opensearch-project/project-website/new/main/_community_projects?message=${message}&description=${dco}&filename=${filename}&target_branch=${branch}&value=${body}`;


                $('#createPR')
                    .attr('href',template);
            };
            $('.active-input').change(createUrl);

            createUrl();
        }
    };

    return new PrMaker();
});
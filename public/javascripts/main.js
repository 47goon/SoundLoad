function makeid() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < 10; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}

document.randID = makeid()

Dropzone.autoDiscover = false;

function paramNameForSend() {
   return "files";
}

$(document).ready(function() {
  var myDropzone = new Dropzone("#uploadDropzone", {
    acceptedFiles: 'image/*,audio/*',
    url: '/upload',
    maxFilesize: 5, // MB
    maxFiles: 10,
    autoProcessQueue: false,
    uploadMultiple: true,
    paramName: paramNameForSend,
    method: 'post',
    parallelUploads: 10,
    init: function() {
        var myDropzone = this;

        myDropzone.on('sendingmultiple', function(data, xhr, formData) {
            $("form").find("input").each(function(){
                console.log("C::: " + $(this).is(":checked") )
                formData.append($(this).attr("name"), $(this).is(":checked") || $(this).val());
            });
        });

        $("#buldUploadForm").submit(function (e) {
            e.preventDefault();
            e.stopPropagation();
            myDropzone.processQueue();
        }); 
      }
    });
});

console.log(document.randID)
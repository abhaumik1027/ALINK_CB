
//Edit Modal
$('#editModal').on('show.bs.modal', function (event) {
	var button = $(event.relatedTarget) // Button that triggered the modal
	var recipient = button.data('whatever')
	const myArray = recipient.split(",");
	var modal = $(this)
	modal.find('.modal-body #fullUrl').val(myArray[0])
	modal.find('.modal-body #shortUrl').val(myArray[1])
	modal.find('.modal-body #prevFullUrl').val(myArray[0])
	modal.find('.modal-body #prevShortUrl').val(myArray[1])
	modal.find('.modal-body #linkID').val(myArray[2])
	modal.find('.modal-body #tag').val(myArray[3])
})

//Delete Modal
$('#delModal').on('show.bs.modal', function (event) {
	var button = $(event.relatedTarget) // Button that triggered the modal
	var recipient = button.data('whatever')
	const myArray = recipient.split(",");
	var modal = $(this)
	modal.find('.modal-body #fullUrl').val(myArray[0])
	modal.find('.modal-body #shortUrl').val(myArray[1])
	modal.find('.modal-body #linkID').val(myArray[2])
})

//Help Modal
$('#helpModal').on('show.bs.modal', function (event) {
	var button = $(event.relatedTarget) // Button that triggered the modal
	var recipient = button.data('whatever')
	var modal = $(this)
})


$(document).ready(function(){
	$('#sortTab').dataTable();
});

$(".js-example-tags").select2({
	tags: true
})

function showfield(name){
	if(name=='other')document.getElementById('div1').innerHTML='&nbsp;<input type="text" name="tag" class="form-control" />';
	else document.getElementById('div1').innerHTML='';
}

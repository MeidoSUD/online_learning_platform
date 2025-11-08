@extends('layouts.app')

@section('title', app()->getLocale() == 'ar' ? 'كتبي' : 'My Books')

@section('content')
<div class="container my-4">
    <h1 class="mb-4 text-center">
        {{ app()->getLocale() == 'ar' ? ' كتبي' : 'My Book ' }}
    </h1>

    <div class="embed-responsive" style="height: 90vh; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
        <iframe 
            src="https://ktby.net/"
            style="width:100%; height:100%; border:none;"
            title="My Book"
            allowfullscreen>
        </iframe>
    </div>
</div>
@endsection

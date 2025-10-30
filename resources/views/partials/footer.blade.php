
    <!-- BEGIN: Footer-->
    <!-- Sidebar Toggle Script -->
    <script>
        function toggleSidebar() {
            const sidebar = document.querySelector('.sidebar');
            const overlay = document.querySelector('.sidebar-overlay');
            const body = document.body;
            
            sidebar.classList.toggle('show');
            overlay.classList.toggle('show');
            body.classList.toggle('sidebar-open');
        }
        
        function closeSidebar() {
            const sidebar = document.querySelector('.sidebar');
            const overlay = document.querySelector('.sidebar-overlay');
            const body = document.body;
            
            sidebar.classList.remove('show');
            overlay.classList.remove('show');
            body.classList.remove('sidebar-open');
        }
        
        // Close sidebar when clicking on a link (mobile only)
        document.addEventListener('DOMContentLoaded', function() {
            if (window.innerWidth <= 991) {
                const sidebarLinks = document.querySelectorAll('.sidebar .nav-link');
                sidebarLinks.forEach(link => {
                    link.addEventListener('click', function(e) {
                        // Only close if it's not a submenu toggle
                        if (!this.closest('.has-sub') || this.getAttribute('href') !== 'javascript:void(0)') {
                            setTimeout(closeSidebar, 100);
                        }
                    });
                });
            }
        });
        
        // Handle window resize
        window.addEventListener('resize', function() {
            if (window.innerWidth > 991) {
                closeSidebar();
            }
        });
    </script>
    <footer class="footer footer-static footer-light">
        <p class="clearfix blue-grey lighten-2 mb-0"><span class="float-md-left d-block d-md-inline-block mt-25">{{ app()->getLocale() == 'ar' ? 'حقوق الطبع' : 'Copyright' }} {{ date('Y') }}<a class="text-bold-800 grey darken-2" href="#"
                    target="_blank">Laravel,</a>{{ app()->getLocale() == 'ar' ? 'كل الحقوق محفوظة' : 'All rights reserved' }}</span><span
                class="float-md-right d-none d-md-block">{{ app()->getLocale() == 'ar' ? 'مصمم بحب' : 'Hand-crafted & Made with' }}<i
                    class="feather icon-heart pink"></i></span>
            <button class="btn btn-primary btn-icon scroll-top" type="button"><i
                    class="feather icon-arrow-up"></i></button>
        </p>
    </footer>
    <!-- END: Footer-->


    <!-- BEGIN: Vendor JS-->
    <script src="{{ asset('/app-assets/vendors/js/vendors.min.js') }}"></script>
    <script src="{{ asset('/app-assets/vendors/js/forms/select/select2.full.min.js') }}"></script>
    <!-- BEGIN Vendor JS-->

    <!-- BEGIN: Page Vendor JS-->
    <script src="{{ asset('/app-assets/vendors/js/ui/prism.min.js') }}"></script>
    <!-- END: Page Vendor JS-->

    <!-- BEGIN: Theme JS-->
    <script src="{{ asset('/app-assets/js/core/app-menu.js') }}"></script>
    <script src="{{ asset('/app-assets/js/core/app.js') }}"></script>
    <!-- END: Theme JS-->
    @yield('scriptjs')
    <!-- BEGIN: Page JS-->
    <!-- END: Page JS-->
</body>
<!-- END: Body-->

</html>
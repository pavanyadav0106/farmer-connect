document.addEventListener("DOMContentLoaded", function () {
    const userRole = localStorage.getItem("userRole"); // Assuming role is stored in localStorage after login

    if (window.location.pathname.includes("welcome.html")) {
        document.body.classList.add("fade-in");
        setTimeout(() => {
            if (userRole === "farmer") {
                window.location.href = "farmer.html";
            } else {
                window.location.href = "customer.html";
            }
        }, 2000); // 2-second delay for a smooth transition
    }

    // Example function to set user role (Call this after login authentication)
    function setUserRole(role) {
        localStorage.setItem("userRole", role);
    }

    // Mock login function (Replace with actual Firebase authentication logic)
    document.getElementById("loginBtn").addEventListener("click", function () {
        const role = document.querySelector("input[name='role']:checked").value;
        setUserRole(role);
        window.location.href = "welcome.html";
    });
});

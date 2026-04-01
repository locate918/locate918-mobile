if(NOT TARGET react-native-worklets-core::rnworklets)
add_library(react-native-worklets-core::rnworklets SHARED IMPORTED)
set_target_properties(react-native-worklets-core::rnworklets PROPERTIES
    IMPORTED_LOCATION "C:/Users/borc8/WebstormProjects/locate918Mobile/node_modules/react-native-worklets-core/android/build/intermediates/cxx/Debug/1n3759z2/obj/armeabi-v7a/librnworklets.so"
    INTERFACE_INCLUDE_DIRECTORIES "C:/Users/borc8/WebstormProjects/locate918Mobile/node_modules/react-native-worklets-core/android/build/headers/rnworklets"
    INTERFACE_LINK_LIBRARIES ""
)
endif()


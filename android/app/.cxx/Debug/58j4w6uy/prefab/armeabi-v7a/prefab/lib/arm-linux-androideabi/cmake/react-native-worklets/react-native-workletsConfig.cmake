if(NOT TARGET react-native-worklets::worklets)
add_library(react-native-worklets::worklets SHARED IMPORTED)
set_target_properties(react-native-worklets::worklets PROPERTIES
    IMPORTED_LOCATION "C:/Users/borc8/WebstormProjects/locate918Mobile/node_modules/react-native-worklets/android/build/intermediates/cxx/Debug/c1u50i5o/obj/armeabi-v7a/libworklets.so"
    INTERFACE_INCLUDE_DIRECTORIES "C:/Users/borc8/WebstormProjects/locate918Mobile/node_modules/react-native-worklets/android/build/prefab-headers/worklets"
    INTERFACE_LINK_LIBRARIES ""
)
endif()


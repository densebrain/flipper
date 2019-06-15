//
// Created by Jonathan Glanz on 2019-06-09.
//

#pragma once

#include <memory>

#define pbRefSet(Msg, Prop, Value) Msg.set_##Prop(Value)
#define pbPtrSet(Msg, Prop, Value) Msg->set_##Prop(Value)

//Name & Name() { return Value; }; \
//  const Name & Name() const { return Value; }

#define PROP_ACCESSOR_EX(Type, Name, Value) Type & Name() { return Value; }; \
  const Type & Name() const { return Value; }

//#define SharedPtr(Type, Name) std::shared_ptr<Type> Name;

#define makeSharedPtr(Type, ...) std::make_shared<Type>(__VA_ARGS__)

#define PROP_ACCESSOR(Type, Name) PROP_ACCESSOR_EX(Type, Name, Name)

//; X & x() const { return x_; }

#define MAKE_KEY(T, O , P)  T " & " P "() { return " O "." P "();};"
#define EXTRACT(stmt) ID(##stmt)
#define EXTRACT(stmt) ID(##stmt)

//#define PB_PROP_ACCESSOR(Type, ProtoRef, Name) EXTRACT(MAKE_KEY(Type, ProtoRef,Name))
#define PB_PROP_ACCESSOR(Type, ProtoRef, Name)  const Type Name() { return ProtoRef.Name(); };
//\
//const Type Name() { return ProtoRef.Name(); };
//, this->config.insecure_port()